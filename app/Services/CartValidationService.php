<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Validation\ValidationException;

class CartValidationService
{
    public function __construct(
        private readonly PromotionPricingService $promotionPricingService,
    ) {}

    public function validateForCheckout(
        Cart $cart,
    ): array {
        /*
         * Semua item menggunakan waktu perhitungan
         * promo yang sama.
         */
        $pricingMoment = now();

        $cart->load([
            'items.productSku.product.vendor',
        ]);

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Keranjang masih kosong.',
            ]);
        }

        $problems = [];

        /*
         * Menampung hasil perhitungan harga terbaru
         * untuk setiap item keranjang.
         */
        $validatedItems = [];

        foreach (
            $cart->items as $item
        ) {
            $sku = $item->productSku;

            $product =
                $sku?->product;

            $vendor =
                $product?->vendor;

            if (
                !$sku ||
                !$product ||
                !$vendor
            ) {
                $problems[] =
                    'Terdapat produk yang sudah tidak tersedia.';

                continue;
            }

            if (
                (int) $item->quantity <
                1
            ) {
                $problems[] =
                    "Jumlah pembelian {$product->name} tidak valid.";

                continue;
            }

            if (
                (int) $sku->stock <=
                0
            ) {
                $problems[] =
                    "Stok {$product->name} sudah habis.";

                continue;
            }

            if (
                (int) $item->quantity >
                (int) $sku->stock
            ) {
                $problems[] =
                    "Jumlah {$product->name} melebihi stok "
                    . "yang tersedia ({$sku->stock}).";

                continue;
            }

            if (
                (float) $sku->price <
                0
            ) {
                $problems[] =
                    "Harga {$product->name} tidak valid.";

                continue;
            }

            /*
             * Hitung promo terbaru yang masih aktif.
             */
            $pricing =
                $this
                ->promotionPricingService
                ->calculate(
                    sku: $sku,

                    quantity: (int) $item
                        ->quantity,

                    moment: $pricingMoment,
                );

            $originalUnitPrice =
                (string) $pricing['original_unit_price'];

            $finalUnitPrice =
                (string) $pricing['final_unit_price'];

            $originalSubtotal =
                (string) $pricing['original_subtotal'];

            $finalSubtotal =
                (string) $pricing['final_subtotal'];

            $discountAmount =
                (string) $pricing['discount_amount'];

            if (
                (float) $finalUnitPrice <
                0
            ) {
                $problems[] =
                    "Harga akhir {$product->name} tidak valid.";

                continue;
            }

            $oldSnapshotMinor =
                $this->toMinorUnits(
                    (string) $item
                        ->price_snapshot,
                );

            $newSnapshotMinor =
                $this->toMinorUnits(
                    $finalUnitPrice,
                );

            $validatedItems[] = [
                'cart_item' =>
                $item,

                'cart_item_id' =>
                (int) $item->id,

                'product_sku_id' =>
                (int) $sku->id,

                'product_name' =>
                $product->name,

                'sku' =>
                $sku->sku,

                'quantity' =>
                (int) $item
                    ->quantity,

                'stock' =>
                (int) $sku->stock,

                'old_price_snapshot' =>
                (string) $item
                    ->price_snapshot,

                'original_unit_price' =>
                $originalUnitPrice,

                'final_unit_price' =>
                $finalUnitPrice,

                'original_subtotal' =>
                $originalSubtotal,

                'final_subtotal' =>
                $finalSubtotal,

                'discount_amount' =>
                $discountAmount,

                'has_discount' =>
                (bool) $pricing['has_discount'],

                'promotion' =>
                $pricing['promotion'],

                'price_changed' =>
                $oldSnapshotMinor !==
                    $newSnapshotMinor,
            ];
        }

        if ($problems !== []) {
            throw ValidationException::withMessages([
                'cart' => implode(
                    ' ',
                    array_unique(
                        $problems,
                    ),
                ),
            ]);
        }

        /*
         * Setelah seluruh item valid, sinkronkan
         * price_snapshot dengan harga promo terbaru.
         *
         * CheckoutService tetap menghitung ulang harga
         * sebagai pengamanan terakhir ketika order dibuat.
         */
        foreach (
            $validatedItems
            as $validatedItem
        ) {
            /** @var CartItem $cartItem */
            $cartItem =
                $validatedItem['cart_item'];

            if (
                !$validatedItem['price_changed']
            ) {
                continue;
            }

            $cartItem->price_snapshot =
                $validatedItem['final_unit_price'];

            $cartItem->save();
        }

        $originalSubtotalMinor =
            collect(
                $validatedItems,
            )->sum(
                fn(
                    array $item,
                ): int =>
                $this->toMinorUnits(
                    $item['original_subtotal'],
                ),
            );

        $finalSubtotalMinor =
            collect(
                $validatedItems,
            )->sum(
                fn(
                    array $item,
                ): int =>
                $this->toMinorUnits(
                    $item['final_subtotal'],
                ),
            );

        $discountTotalMinor =
            max(
                0,
                $originalSubtotalMinor -
                    $finalSubtotalMinor,
            );

        $priceChanged =
            collect(
                $validatedItems,
            )->contains(
                fn(
                    array $item,
                ): bool =>
                (bool) $item['price_changed'],
            );

        return [
            'item_count' =>
            (int) $cart
                ->items
                ->sum('quantity'),

            /*
             * Dipertahankan agar controller lama
             * yang membaca subtotal tidak rusak.
             */
            'subtotal' =>
            (float) $this
                ->toDecimalString(
                    $finalSubtotalMinor,
                ),

            'original_subtotal' =>
            (float) $this
                ->toDecimalString(
                    $originalSubtotalMinor,
                ),

            'discount_total' =>
            (float) $this
                ->toDecimalString(
                    $discountTotalMinor,
                ),

            'has_discount' =>
            $discountTotalMinor > 0,

            'price_changed' =>
            $priceChanged,

            'priced_at' =>
            $pricingMoment
                ->toISOString(),

            'items' =>
            collect(
                $validatedItems,
            )
                ->map(
                    function (
                        array $item,
                    ): array {
                        unset(
                            $item['cart_item'],
                        );

                        return $item;
                    },
                )
                ->values()
                ->all(),
        ];
    }

    /**
     * Mengubah decimal string menjadi satuan minor.
     *
     * Contoh:
     * 15000.50 menjadi 1500050.
     */
    private function toMinorUnits(
        string $amount,
    ): int {
        [$whole, $fraction] =
            array_pad(
                explode(
                    '.',
                    $amount,
                    2,
                ),
                2,
                '0',
            );

        $fraction = str_pad(
            substr(
                $fraction,
                0,
                2,
            ),
            2,
            '0',
        );

        return (
            (int) $whole * 100
        ) + (int) $fraction;
    }

    /**
     * Mengubah satuan minor menjadi decimal string.
     */
    private function toDecimalString(
        int $amount,
    ): string {
        $whole =
            intdiv(
                $amount,
                100,
            );

        $fraction =
            abs(
                $amount % 100,
            );

        return sprintf(
            '%d.%02d',
            $whole,
            $fraction,
        );
    }
}
