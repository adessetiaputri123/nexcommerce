<?php

namespace App\Services;

use App\Models\ProductSku;
use App\Models\Promotion;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PromotionPricingService
{
    /**
     * Menghitung harga SKU berdasarkan promo aktif.
     *
     * @return array{
     *     quantity: int,
     *     original_unit_price: string,
     *     original_subtotal: string,
     *     discount_amount: string,
     *     final_unit_price: string,
     *     final_subtotal: string,
     *     has_discount: bool,
     *     promotion: array<string, mixed>|null
     * }
     */
    public function calculate(
        ProductSku $sku,
        int $quantity = 1,
        ?CarbonInterface $moment = null,
    ): array {
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'Jumlah produk minimal 1.',
            ]);
        }

        $moment ??= now();

        $sku->loadMissing('product');

        if (!$sku->product) {
            throw ValidationException::withMessages([
                'product' => 'Produk dari SKU tersebut tidak ditemukan.',
            ]);
        }

        $originalUnitPrice = round(
            (float) $sku->price,
            2,
        );

        $originalSubtotal = round(
            $originalUnitPrice * $quantity,
            2,
        );

        /**
         * @var Collection<int, array{
         *     promotion: Promotion,
         *     discount_amount: float
         * }> $promotionCandidates
         */
        $promotionCandidates = $sku
            ->product
            ->promotions()
            ->active($moment)
            ->get()
            ->map(
                function (
                    Promotion $promotion,
                ) use (
                    $originalSubtotal,
                    $quantity,
                ): ?array {
                    if (
                        !$this->meetsMinimumAmount(
                            promotion: $promotion,
                            subtotal: $originalSubtotal,
                        )
                    ) {
                        return null;
                    }

                    $discountAmount =
                        $this->calculateDiscountAmount(
                            promotion: $promotion,
                            quantity: $quantity,
                            subtotal: $originalSubtotal,
                        );

                    if ($discountAmount <= 0) {
                        return null;
                    }

                    return [
                        'promotion' => $promotion,
                        'discount_amount' => $discountAmount,
                    ];
                },
            )
            ->filter(
                fn(?array $candidate): bool =>
                $candidate !== null,
            )
            ->values();

        $selectedCandidate =
            $this->selectBestPromotion(
                $promotionCandidates,
            );

        if ($selectedCandidate === null) {
            return $this->buildWithoutPromotionResult(
                quantity: $quantity,
                originalUnitPrice: $originalUnitPrice,
                originalSubtotal: $originalSubtotal,
            );
        }

        /** @var Promotion $promotion */
        $promotion =
            $selectedCandidate['promotion'];

        $discountAmount = min(
            (float) $selectedCandidate['discount_amount'],
            $originalSubtotal,
        );

        $finalSubtotal = round(
            max(
                0,
                $originalSubtotal - $discountAmount,
            ),
            2,
        );

        $finalUnitPrice = round(
            $finalSubtotal / $quantity,
            2,
        );

        return [
            'quantity' => $quantity,

            'original_unit_price' =>
            $this->formatMoney(
                $originalUnitPrice,
            ),

            'original_subtotal' =>
            $this->formatMoney(
                $originalSubtotal,
            ),

            'discount_amount' =>
            $this->formatMoney(
                $discountAmount,
            ),

            'final_unit_price' =>
            $this->formatMoney(
                $finalUnitPrice,
            ),

            'final_subtotal' =>
            $this->formatMoney(
                $finalSubtotal,
            ),

            'has_discount' => true,

            'promotion' => [
                'id' => $promotion->id,

                'name' => $promotion->name,

                'campaign_type' =>
                $promotion->campaign_type,

                'discount_type' =>
                $promotion->discount_type,

                'discount_value' =>
                (string) $promotion
                    ->discount_value,

                'minimum_order_amount' =>
                $promotion
                    ->minimum_order_amount,

                'maximum_discount_amount' =>
                $promotion
                    ->maximum_discount_amount,

                'starts_at' =>
                $promotion
                    ->starts_at
                    ?->toISOString(),

                'ends_at' =>
                $promotion
                    ->ends_at
                    ?->toISOString(),

                'priority' =>
                (int) $promotion->priority,
            ],
        ];
    }

    private function meetsMinimumAmount(
        Promotion $promotion,
        float $subtotal,
    ): bool {
        if (
            $promotion->minimum_order_amount
            === null
        ) {
            return true;
        }

        return $subtotal >=
            (float) $promotion
                ->minimum_order_amount;
    }

    private function calculateDiscountAmount(
        Promotion $promotion,
        int $quantity,
        float $subtotal,
    ): float {
        $discountValue = max(
            0,
            (float) $promotion->discount_value,
        );

        $discountAmount = match ($promotion->discount_type) {
            Promotion::DISCOUNT_PERCENTAGE =>
            $this->calculatePercentageDiscount(
                percentage: $discountValue,
                subtotal: $subtotal,
            ),

            /*
             * Diskon nominal dihitung untuk setiap
             * satu unit SKU yang dibeli.
             */
            Promotion::DISCOUNT_FIXED =>
            $discountValue * $quantity,

            default => 0,
        };

        if (
            $promotion->maximum_discount_amount
            !== null
        ) {
            $discountAmount = min(
                $discountAmount,
                (float) $promotion
                    ->maximum_discount_amount,
            );
        }

        return round(
            min(
                $discountAmount,
                $subtotal,
            ),
            2,
        );
    }

    private function calculatePercentageDiscount(
        float $percentage,
        float $subtotal,
    ): float {
        /*
         * Pengamanan tambahan agar nilai persentase
         * tidak menghasilkan diskon lebih dari 100%.
         */
        $safePercentage = min(
            100,
            max(0, $percentage),
        );

        return $subtotal *
            ($safePercentage / 100);
    }

    /**
     * Promo dengan prioritas tertinggi dipilih.
     * Jika prioritas sama, pilih nominal diskon terbesar.
     * Jika tetap sama, pilih promo terbaru.
     *
     * @param Collection<int, array{
     *     promotion: Promotion,
     *     discount_amount: float
     * }> $candidates
     *
     * @return array{
     *     promotion: Promotion,
     *     discount_amount: float
     * }|null
     */
    private function selectBestPromotion(
        Collection $candidates,
    ): ?array {
        if ($candidates->isEmpty()) {
            return null;
        }

        return $candidates
            ->sort(
                function (
                    array $first,
                    array $second,
                ): int {
                    $firstPromotion =
                        $first['promotion'];

                    $secondPromotion =
                        $second['promotion'];

                    $priorityComparison =
                        (int) $secondPromotion->priority
                        <=>
                        (int) $firstPromotion->priority;

                    if ($priorityComparison !== 0) {
                        return $priorityComparison;
                    }

                    $discountComparison =
                        (float) $second['discount_amount']
                        <=>
                        (float) $first['discount_amount'];

                    if ($discountComparison !== 0) {
                        return $discountComparison;
                    }

                    return (int) $secondPromotion->id
                        <=>
                        (int) $firstPromotion->id;
                },
            )
            ->first();
    }

    /**
     * @return array{
     *     quantity: int,
     *     original_unit_price: string,
     *     original_subtotal: string,
     *     discount_amount: string,
     *     final_unit_price: string,
     *     final_subtotal: string,
     *     has_discount: bool,
     *     promotion: null
     * }
     */
    private function buildWithoutPromotionResult(
        int $quantity,
        float $originalUnitPrice,
        float $originalSubtotal,
    ): array {
        return [
            'quantity' => $quantity,

            'original_unit_price' =>
            $this->formatMoney(
                $originalUnitPrice,
            ),

            'original_subtotal' =>
            $this->formatMoney(
                $originalSubtotal,
            ),

            'discount_amount' =>
            $this->formatMoney(0),

            'final_unit_price' =>
            $this->formatMoney(
                $originalUnitPrice,
            ),

            'final_subtotal' =>
            $this->formatMoney(
                $originalSubtotal,
            ),

            'has_discount' => false,

            'promotion' => null,
        ];
    }

    private function formatMoney(
        float $amount,
    ): string {
        return number_format(
            max(0, $amount),
            2,
            '.',
            '',
        );
    }
}
