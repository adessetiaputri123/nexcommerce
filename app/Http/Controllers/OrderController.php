<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            Order::class,
        );

        $orders = Order::query()
            ->where(
                'customer_id',
                $request->user()->id,
            )
            ->with('vendorOrders.vendor')
            ->withCount('vendorOrders')
            ->latest()
            ->get()
            ->map(function (Order $order): array {
                return [
                    'id' =>
                    $order->id,

                    'grand_total' =>
                    $order->grand_total,

                    'payment_status' =>
                    $order->payment_status,

                    'payment_reference' =>
                    $order->payment_reference,

                    'paid_at' =>
                    $order->paid_at
                        ?->toIso8601String(),

                    'expires_at' =>
                    $order->expires_at
                        ?->toIso8601String(),

                    'expired_at' =>
                    $order->expired_at
                        ?->toIso8601String(),

                    'is_payment_expired' =>
                    $this->isPaymentExpired(
                        $order,
                    ),

                    'created_at' =>
                    $order->created_at
                        ?->toIso8601String(),

                    'vendor_order_count' =>
                    (int) $order
                        ->vendor_orders_count,

                    'vendors' =>
                    $order
                        ->vendorOrders
                        ->map(
                            function (
                                $vendorOrder,
                            ): array {
                                return [
                                    'id' =>
                                    $vendorOrder
                                        ->vendor
                                        ->id,

                                    'shop_name' =>
                                    $vendorOrder
                                        ->vendor
                                        ->shop_name,

                                    'delivery_status' =>
                                    $vendorOrder
                                        ->delivery_status,
                                ];
                            },
                        )
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render(
            'Orders/Index',
            [
                'orders' =>
                $orders,
            ],
        );
    }

    public function show(
        Order $order,
    ): Response {
        Gate::authorize(
            'view',
            $order,
        );

        $order->load([
            'vendorOrders.vendor',
            'vendorOrders.items.productSku.product',
        ]);

        $vendorOrders =
            $order
            ->vendorOrders
            ->map(
                function (
                    $vendorOrder,
                ): array {
                    $items =
                        $vendorOrder
                        ->items
                        ->map(
                            function (
                                $item,
                            ): array {
                                $sku =
                                    $item
                                    ->productSku;

                                $product =
                                    $sku
                                    ?->product;

                                $quantity =
                                    (int) $item
                                        ->quantity;

                                /*
                                         * Untuk pesanan lama yang belum
                                         * memiliki snapshot promo, harga
                                         * asli memakai harga final.
                                         */
                                $originalPrice =
                                    (string) (
                                        $item
                                        ->original_price
                                        ?? $item->price
                                    );

                                $finalPrice =
                                    (string) $item
                                        ->price;

                                $originalPriceMinor =
                                    $this
                                    ->toMinorUnits(
                                        $originalPrice,
                                    );

                                $finalPriceMinor =
                                    $this
                                    ->toMinorUnits(
                                        $finalPrice,
                                    );

                                $unitDiscountMinor =
                                    max(
                                        0,
                                        $originalPriceMinor
                                            - $finalPriceMinor,
                                    );

                                $originalTotalMinor =
                                    $originalPriceMinor
                                    * $quantity;

                                $finalTotalMinor =
                                    $finalPriceMinor
                                    * $quantity;

                                $discountTotalMinor =
                                    max(
                                        0,
                                        $originalTotalMinor
                                            - $finalTotalMinor,
                                    );

                                $hasPromotionSnapshot =
                                    $item->promotion_id
                                    !== null
                                    || $item->promotion_name
                                    !== null;

                                return [
                                    'id' =>
                                    $item->id,

                                    'quantity' =>
                                    $quantity,

                                    /*
                                             * Field price tetap disediakan
                                             * agar halaman lama tidak rusak.
                                             */
                                    'price' =>
                                    $finalPrice,

                                    'final_price' =>
                                    $finalPrice,

                                    'original_price' =>
                                    $originalPrice,

                                    'unit_discount_amount' =>
                                    $this
                                        ->toDecimalString(
                                            $unitDiscountMinor,
                                        ),

                                    'original_total' =>
                                    $this
                                        ->toDecimalString(
                                            $originalTotalMinor,
                                        ),

                                    'final_total' =>
                                    $this
                                        ->toDecimalString(
                                            $finalTotalMinor,
                                        ),

                                    'discount_total' =>
                                    $this
                                        ->toDecimalString(
                                            $discountTotalMinor,
                                        ),

                                    'has_discount' =>
                                    $discountTotalMinor
                                        > 0,

                                    /*
                                             * Gunakan snapshot promo,
                                             * bukan relasi promo aktif.
                                             */
                                    'promotion' =>
                                    $hasPromotionSnapshot
                                        ? [
                                            'id' =>
                                            $item
                                                ->promotion_id,

                                            'name' =>
                                            $item
                                                ->promotion_name,

                                            'discount_type' =>
                                            $item
                                                ->promotion_discount_type,

                                            'discount_value' =>
                                            $item
                                                ->promotion_discount_value,
                                        ]
                                        : null,

                                    'product_name' =>
                                    $product
                                        ?->name
                                        ?? 'Produk tidak tersedia',

                                    'sku' =>
                                    $sku?->sku
                                        ?? '-',
                                ];
                            },
                        )
                        ->values();

                    $originalSubtotalMinor =
                        $items->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this
                                ->toMinorUnits(
                                    $item['original_total'],
                                ),
                        );

                    $finalSubtotalMinor =
                        $items->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this
                                ->toMinorUnits(
                                    $item['final_total'],
                                ),
                        );

                    $discountTotalMinor =
                        max(
                            0,
                            $originalSubtotalMinor
                                - $finalSubtotalMinor,
                        );

                    $shippingCostMinor =
                        $this->toMinorUnits(
                            (string) $vendorOrder
                                ->shipping_cost,
                        );

                    return [
                        'id' =>
                        $vendorOrder->id,

                        /*
                             * Subtotal tersimpan pada vendor
                             * order tetap menjadi sumber utama.
                             */
                        'subtotal' =>
                        $vendorOrder->subtotal,

                        'original_subtotal' =>
                        $this
                            ->toDecimalString(
                                $originalSubtotalMinor,
                            ),

                        'discount_total' =>
                        $this
                            ->toDecimalString(
                                $discountTotalMinor,
                            ),

                        'has_discount' =>
                        $discountTotalMinor
                            > 0,

                        'shipping_cost' =>
                        $vendorOrder
                            ->shipping_cost,

                        'total' =>
                        $this
                            ->toDecimalString(
                                $finalSubtotalMinor
                                    + $shippingCostMinor,
                            ),

                        'delivery_status' =>
                        $vendorOrder
                            ->delivery_status,

                        'vendor' => [
                            'id' =>
                            $vendorOrder
                                ->vendor
                                ->id,

                            'shop_name' =>
                            $vendorOrder
                                ->vendor
                                ->shop_name,
                        ],

                        'items' =>
                        $items->all(),

                        /*
                             * Dipakai hanya untuk menghitung
                             * ringkasan order di bawah.
                             */
                        '_original_subtotal_minor' =>
                        $originalSubtotalMinor,

                        '_final_subtotal_minor' =>
                        $finalSubtotalMinor,

                        '_discount_total_minor' =>
                        $discountTotalMinor,

                        '_shipping_cost_minor' =>
                        $shippingCostMinor,
                    ];
                },
            )
            ->values();

        $originalProductSubtotalMinor =
            $vendorOrders->sum(
                '_original_subtotal_minor',
            );

        $productSubtotalMinor =
            $vendorOrders->sum(
                '_final_subtotal_minor',
            );

        $discountTotalMinor =
            $vendorOrders->sum(
                '_discount_total_minor',
            );

        $shippingTotalMinor =
            $vendorOrders->sum(
                '_shipping_cost_minor',
            );

        /*
         * Hapus data internal sebelum dikirim
         * menuju React.
         */
        $formattedVendorOrders =
            $vendorOrders
            ->map(
                function (
                    array $vendorOrder,
                ): array {
                    unset(
                        $vendorOrder['_original_subtotal_minor'],
                        $vendorOrder['_final_subtotal_minor'],
                        $vendorOrder['_discount_total_minor'],
                        $vendorOrder['_shipping_cost_minor'],
                    );

                    return $vendorOrder;
                },
            )
            ->values()
            ->all();

        return Inertia::render(
            'Orders/Show',
            [
                'order' => [
                    'id' =>
                    $order->id,

                    'grand_total' =>
                    $order->grand_total,

                    'original_product_subtotal' =>
                    $this
                        ->toDecimalString(
                            $originalProductSubtotalMinor,
                        ),

                    'product_subtotal' =>
                    $this
                        ->toDecimalString(
                            $productSubtotalMinor,
                        ),

                    'discount_total' =>
                    $this
                        ->toDecimalString(
                            $discountTotalMinor,
                        ),

                    'shipping_total' =>
                    $this
                        ->toDecimalString(
                            $shippingTotalMinor,
                        ),

                    'has_discount' =>
                    $discountTotalMinor > 0,

                    'payment_status' =>
                    $order->payment_status,

                    'payment_reference' =>
                    $order->payment_reference,

                    'paid_at' =>
                    $order->paid_at
                        ?->toIso8601String(),

                    'expires_at' =>
                    $order->expires_at
                        ?->toIso8601String(),

                    'expired_at' =>
                    $order->expired_at
                        ?->toIso8601String(),

                    'is_payment_expired' =>
                    $this->isPaymentExpired(
                        $order,
                    ),

                    'created_at' =>
                    $order->created_at
                        ?->toIso8601String(),

                    'vendor_orders' =>
                    $formattedVendorOrders,
                ],
            ],
        );
    }

    private function isPaymentExpired(
        Order $order,
    ): bool {
        return $order->payment_status
            === 'expired'
            || (
                $order->payment_status
                === 'unpaid'
                && $order->expires_at
                !== null
                && $order->expires_at
                ->isPast()
            );
    }

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

        $fraction =
            str_pad(
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
