<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductSku;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class ProductCatalogPricingService
{
    public function __construct(
        private readonly PromotionPricingService $promotionPricingService,
    ) {}

    /**
     * Menyiapkan seluruh informasi harga produk
     * untuk katalog dan detail produk.
     *
     * @return array{
     *     has_skus: bool,
     *     has_discount: bool,
     *     lowest_original_price: string|null,
     *     highest_original_price: string|null,
     *     lowest_final_price: string|null,
     *     highest_final_price: string|null,
     *     maximum_discount_percentage: float,
     *     best_promotion: array<string, mixed>|null,
     *     skus: array<int, array<string, mixed>>
     * }
     */
    public function forProduct(
        Product $product,
        ?CarbonInterface $moment = null,
    ): array {
        $moment ??= now();

        $product->loadMissing([
            'skus',
        ]);

        if ($product->skus->isEmpty()) {
            return $this->emptyResult();
        }

        $skuItems = $product
            ->skus
            ->map(
                function (
                    ProductSku $sku,
                ) use (
                    $moment,
                ): array {
                    $pricing =
                        $this->promotionPricingService
                        ->calculate(
                            sku: $sku,
                            quantity: 1,
                            moment: $moment,
                        );

                    $discountPercentage =
                        $this->calculateDiscountPercentage(
                            originalSubtotal: $pricing['original_subtotal'],
                            discountAmount: $pricing['discount_amount'],
                        );

                    return [
                        'id' =>
                        $sku->id,

                        'sku' =>
                        $sku->sku,

                        'stock' =>
                        (int) $sku->stock,

                        'is_available' =>
                        (int) $sku->stock > 0,

                        'original_price' =>
                        $pricing['original_unit_price'],

                        'final_price' =>
                        $pricing['final_unit_price'],

                        'discount_amount' =>
                        $pricing['discount_amount'],

                        'discount_percentage' =>
                        $discountPercentage,

                        'has_discount' =>
                        $pricing['has_discount'],

                        'promotion' =>
                        $pricing['promotion'],
                    ];
                },
            )
            ->values();

        $lowestOriginalPrice =
            $this->minimumPrice(
                items: $skuItems,
                field: 'original_price',
            );

        $highestOriginalPrice =
            $this->maximumPrice(
                items: $skuItems,
                field: 'original_price',
            );

        $lowestFinalPrice =
            $this->minimumPrice(
                items: $skuItems,
                field: 'final_price',
            );

        $highestFinalPrice =
            $this->maximumPrice(
                items: $skuItems,
                field: 'final_price',
            );

        $maximumDiscountPercentage =
            (float) (
                $skuItems
                ->max(
                    'discount_percentage',
                )
                ?? 0
            );

        $bestDiscountSku =
            $skuItems
            ->filter(
                fn(
                    array $item,
                ): bool =>
                $item['has_discount'],
            )
            ->sortByDesc(
                'discount_percentage',
            )
            ->first();

        return [
            'has_skus' =>
            true,

            'has_discount' =>
            $skuItems->contains(
                fn(
                    array $item,
                ): bool =>
                $item['has_discount'],
            ),

            'lowest_original_price' =>
            $this->formatMoney(
                $lowestOriginalPrice,
            ),

            'highest_original_price' =>
            $this->formatMoney(
                $highestOriginalPrice,
            ),

            'lowest_final_price' =>
            $this->formatMoney(
                $lowestFinalPrice,
            ),

            'highest_final_price' =>
            $this->formatMoney(
                $highestFinalPrice,
            ),

            'maximum_discount_percentage' =>
            $maximumDiscountPercentage,

            'best_promotion' =>
            $bestDiscountSku['promotion'] ?? null,

            'skus' =>
            $skuItems->all(),
        ];
    }

    /**
     * Digunakan apabila produk tidak memiliki SKU.
     *
     * @return array{
     *     has_skus: false,
     *     has_discount: false,
     *     lowest_original_price: null,
     *     highest_original_price: null,
     *     lowest_final_price: null,
     *     highest_final_price: null,
     *     maximum_discount_percentage: float,
     *     best_promotion: null,
     *     skus: array<int, array<string, mixed>>
     * }
     */
    private function emptyResult(): array
    {
        return [
            'has_skus' =>
            false,

            'has_discount' =>
            false,

            'lowest_original_price' =>
            null,

            'highest_original_price' =>
            null,

            'lowest_final_price' =>
            null,

            'highest_final_price' =>
            null,

            'maximum_discount_percentage' =>
            0,

            'best_promotion' =>
            null,

            'skus' =>
            [],
        ];
    }

    private function calculateDiscountPercentage(
        string $originalSubtotal,
        string $discountAmount,
    ): float {
        $original =
            (float) $originalSubtotal;

        $discount =
            (float) $discountAmount;

        if (
            $original <= 0 ||
            $discount <= 0
        ) {
            return 0;
        }

        return round(
            min(
                100,
                (
                    $discount /
                    $original
                ) * 100,
            ),
            2,
        );
    }

    /**
     * @param Collection<int, array<string, mixed>> $items
     */
    private function minimumPrice(
        Collection $items,
        string $field,
    ): float {
        return (float) (
            $items
            ->map(
                fn(
                    array $item,
                ): float =>
                (float) $item[$field],
            )
            ->min()
            ?? 0
        );
    }

    /**
     * @param Collection<int, array<string, mixed>> $items
     */
    private function maximumPrice(
        Collection $items,
        string $field,
    ): float {
        return (float) (
            $items
            ->map(
                fn(
                    array $item,
                ): float =>
                (float) $item[$field],
            )
            ->max()
            ?? 0
        );
    }

    private function formatMoney(
        float $amount,
    ): string {
        return number_format(
            max(
                0,
                $amount,
            ),
            2,
            '.',
            '',
        );
    }
}
