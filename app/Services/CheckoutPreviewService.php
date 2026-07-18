<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Validation\ValidationException;

class CheckoutPreviewService
{
    public function __construct(
        private readonly PromotionPricingService $promotionPricingService,
    ) {}

    public function build(
        Cart $cart,
    ): array {
        /*
         * Semua item dalam preview menggunakan waktu
         * pemeriksaan promo yang sama.
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
         * Pastikan seluruh relasi masih tersedia sebelum
         * membuat kelompok vendor.
         */
        foreach ($cart->items as $item) {
            $sku = $item->productSku;
            $product = $sku?->product;
            $vendor = $product?->vendor;

            if (
                !$sku ||
                !$product ||
                !$vendor
            ) {
                $problems[] =
                    'Terdapat produk yang sudah tidak tersedia.';

                continue;
            }

            if ((int) $item->quantity < 1) {
                $problems[] =
                    "Jumlah pembelian {$product->name} tidak valid.";

                continue;
            }

            if (
                (int) $item->quantity >
                (int) $sku->stock
            ) {
                $problems[] =
                    "Stok {$product->name} hanya tersedia {$sku->stock}.";
            }

            if ((float) $sku->price < 0) {
                $problems[] =
                    "Harga {$product->name} tidak valid.";
            }
        }

        if ($problems !== []) {
            throw ValidationException::withMessages([
                'cart' => implode(
                    ' ',
                    array_unique($problems),
                ),
            ]);
        }

        /*
         * Variabel internal *_minor digunakan agar
         * penjumlahan total tidak bergantung pada float.
         */
        $vendorGroupsWithMinor = $cart
            ->items
            ->groupBy(
                fn(CartItem $item): int =>
                (int) $item
                    ->productSku
                    ->product
                    ->vendor_id,
            )
            ->map(
                function (
                    $items,
                ) use (
                    $pricingMoment,
                ): array {
                    /** @var CartItem $firstItem */
                    $firstItem = $items->first();

                    $vendor = $firstItem
                        ->productSku
                        ->product
                        ->vendor;

                    $formattedItems = $items
                        ->map(
                            function (
                                CartItem $item,
                            ) use (
                                $pricingMoment,
                            ): array {
                                $sku =
                                    $item->productSku;

                                $product =
                                    $sku->product;

                                /*
                                 * Hitung promo berdasarkan harga
                                 * dan jadwal promo terbaru.
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

                                $unitDiscountMinor = max(
                                    0,
                                    $this->toMinorUnits(
                                        $originalUnitPrice,
                                    ) -
                                        $this->toMinorUnits(
                                            $finalUnitPrice,
                                        ),
                                );

                                $priceChanged =
                                    $this->toMinorUnits(
                                        (string) $item
                                            ->price_snapshot,
                                    ) !==
                                    $this->toMinorUnits(
                                        $finalUnitPrice,
                                    );

                                return [
                                    'cart_item_id' =>
                                    $item->id,

                                    'quantity' =>
                                    (int) $item
                                        ->quantity,

                                    /*
                                     * Field price dipertahankan
                                     * agar frontend lama tidak rusak.
                                     * Nilainya sekarang harga akhir.
                                     */
                                    'price' =>
                                    $finalUnitPrice,

                                    'original_price' =>
                                    $originalUnitPrice,

                                    'final_price' =>
                                    $finalUnitPrice,

                                    /*
                                     * Snapshot lama dari keranjang
                                     * hanya untuk informasi perubahan.
                                     */
                                    'cart_price_snapshot' =>
                                    (string) $item
                                        ->price_snapshot,

                                    'price_changed' =>
                                    $priceChanged,

                                    /*
                                     * Potongan per satu unit.
                                     */
                                    'unit_discount_amount' =>
                                    $this->toDecimalString(
                                        $unitDiscountMinor,
                                    ),

                                    /*
                                     * Total potongan untuk seluruh
                                     * jumlah item ini.
                                     */
                                    'discount_amount' =>
                                    $discountAmount,

                                    'has_discount' =>
                                    (bool) $pricing['has_discount'],

                                    'promotion' =>
                                    $pricing['promotion'],

                                    /*
                                     * subtotal dipertahankan sebagai
                                     * angka agar frontend lama tetap
                                     * dapat memformatnya.
                                     */
                                    'subtotal' =>
                                    (float) $finalSubtotal,

                                    'original_subtotal' =>
                                    (float) $originalSubtotal,

                                    'final_subtotal' =>
                                    (float) $finalSubtotal,

                                    'savings' =>
                                    (float) $discountAmount,

                                    'product' => [
                                        'id' =>
                                        $product->id,

                                        'name' =>
                                        $product->name,
                                    ],

                                    'sku' => [
                                        'id' =>
                                        $sku->id,

                                        'code' =>
                                        $sku->sku,

                                        'stock' =>
                                        (int) $sku
                                            ->stock,
                                    ],
                                ];
                            },
                        )
                        ->values();

                    $subtotalMinor =
                        $formattedItems->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this->toMinorUnits(
                                (string) $item['final_subtotal'],
                            ),
                        );

                    $originalSubtotalMinor =
                        $formattedItems->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this->toMinorUnits(
                                (string) $item['original_subtotal'],
                            ),
                        );

                    $discountMinor = max(
                        0,
                        $originalSubtotalMinor -
                            $subtotalMinor,
                    );

                    /*
                     * Ongkos kirim sementara nol.
                     */
                    $shippingCostMinor = 0;

                    $totalMinor =
                        $subtotalMinor +
                        $shippingCostMinor;

                    return [
                        'vendor' => [
                            'id' =>
                            $vendor->id,

                            'shop_name' =>
                            $vendor
                                ->shop_name,
                        ],

                        'items' =>
                        $formattedItems
                            ->all(),

                        'original_subtotal' =>
                        (float) $this
                            ->toDecimalString(
                                $originalSubtotalMinor,
                            ),

                        'discount_total' =>
                        (float) $this
                            ->toDecimalString(
                                $discountMinor,
                            ),

                        'subtotal' =>
                        (float) $this
                            ->toDecimalString(
                                $subtotalMinor,
                            ),

                        'shipping_cost' =>
                        (float) $this
                            ->toDecimalString(
                                $shippingCostMinor,
                            ),

                        'total' =>
                        (float) $this
                            ->toDecimalString(
                                $totalMinor,
                            ),

                        /*
                         * Data internal untuk menghitung
                         * ringkasan seluruh vendor.
                         */
                        '_original_subtotal_minor' =>
                        $originalSubtotalMinor,

                        '_discount_minor' =>
                        $discountMinor,

                        '_subtotal_minor' =>
                        $subtotalMinor,

                        '_shipping_minor' =>
                        $shippingCostMinor,

                        '_total_minor' =>
                        $totalMinor,
                    ];
                },
            )
            ->values();

        $originalProductSubtotalMinor =
            $vendorGroupsWithMinor->sum(
                '_original_subtotal_minor',
            );

        $discountTotalMinor =
            $vendorGroupsWithMinor->sum(
                '_discount_minor',
            );

        $productSubtotalMinor =
            $vendorGroupsWithMinor->sum(
                '_subtotal_minor',
            );

        $shippingTotalMinor =
            $vendorGroupsWithMinor->sum(
                '_shipping_minor',
            );

        $grandTotalMinor =
            $vendorGroupsWithMinor->sum(
                '_total_minor',
            );

        /*
         * Hapus data internal sebelum dikirim
         * menuju halaman React.
         */
        $vendorGroups =
            $vendorGroupsWithMinor
            ->map(
                function (
                    array $vendorGroup,
                ): array {
                    unset(
                        $vendorGroup['_original_subtotal_minor'],
                        $vendorGroup['_discount_minor'],
                        $vendorGroup['_subtotal_minor'],
                        $vendorGroup['_shipping_minor'],
                        $vendorGroup['_total_minor'],
                    );

                    return $vendorGroup;
                },
            )
            ->values();

        return [
            'vendors' =>
            $vendorGroups
                ->all(),

            'item_count' =>
            (int) $cart
                ->items
                ->sum('quantity'),

            /*
             * Total harga sebelum promo.
             */
            'original_product_subtotal' =>
            (float) $this
                ->toDecimalString(
                    $originalProductSubtotalMinor,
                ),

            /*
             * Total penghematan dari semua promo.
             */
            'discount_total' =>
            (float) $this
                ->toDecimalString(
                    $discountTotalMinor,
                ),

            /*
             * Total produk setelah promo.
             */
            'product_subtotal' =>
            (float) $this
                ->toDecimalString(
                    $productSubtotalMinor,
                ),

            'shipping_total' =>
            (float) $this
                ->toDecimalString(
                    $shippingTotalMinor,
                ),

            'grand_total' =>
            (float) $this
                ->toDecimalString(
                    $grandTotalMinor,
                ),

            'has_discount' =>
            $discountTotalMinor > 0,

            'priced_at' =>
            $pricingMoment
                ->toISOString(),
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
