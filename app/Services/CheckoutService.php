<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\ProductSku;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly PromotionPricingService $promotionPricingService,
    ) {}

    public function place(
        User $customer,
    ): Order {
        return DB::transaction(
            function () use ($customer): Order {
                /*
                 * Semua item checkout memakai waktu
                 * perhitungan promo yang sama.
                 */
                $pricingMoment = now();

                /*
                 * Kunci keranjang agar tidak diproses
                 * dua kali secara bersamaan.
                 */
                $cart = Cart::query()
                    ->where(
                        'customer_id',
                        $customer->id,
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$cart) {
                    throw ValidationException::withMessages([
                        'cart' => 'Keranjang masih kosong.',
                    ]);
                }

                /*
                 * Kunci seluruh item keranjang.
                 */
                $cartItems = CartItem::query()
                    ->where(
                        'cart_id',
                        $cart->id,
                    )
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                if ($cartItems->isEmpty()) {
                    throw ValidationException::withMessages([
                        'cart' => 'Keranjang masih kosong.',
                    ]);
                }

                $skuIds = $cartItems
                    ->pluck('product_sku_id')
                    ->unique()
                    ->sort()
                    ->values();

                /*
                 * Kunci seluruh SKU yang dibeli.
                 */
                $skus = ProductSku::query()
                    ->with([
                        'product.vendor',
                    ])
                    ->whereIn(
                        'id',
                        $skuIds,
                    )
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $problems = [];

                /*
                 * Snapshot hasil kalkulasi promo untuk
                 * setiap cart item.
                 */
                $pricingSnapshots = [];

                foreach ($cartItems as $item) {
                    $sku = $skus->get(
                        $item->product_sku_id,
                    );

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
                            "Stok {$product->name} hanya tersedia "
                            . "{$sku->stock}.";

                        continue;
                    }

                    if ((float) $sku->price < 0) {
                        $problems[] =
                            "Harga {$product->name} tidak valid.";

                        continue;
                    }

                    /*
                     * Hitung kembali promo yang masih aktif
                     * ketika order dibuat.
                     */
                    $pricing =
                        $this
                        ->promotionPricingService
                        ->calculate(
                            sku: $sku,
                            quantity: (int) $item->quantity,
                            moment: $pricingMoment,
                        );

                    if (
                        (float) $pricing['final_unit_price'] < 0
                    ) {
                        $problems[] =
                            "Harga akhir {$product->name} tidak valid.";

                        continue;
                    }

                    $pricingSnapshots[(int) $item->id] = $pricing;

                    /*
                     * Harga akhir digunakan sebagai snapshot
                     * keranjang dan harga order item.
                     */
                    $item->price_snapshot =
                        $pricing['final_unit_price'];
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
                 * Grand total memakai harga akhir setelah
                 * promo dikalikan jumlah barang.
                 */
                $grandTotalMinor = $cartItems->sum(
                    fn(CartItem $item): int =>
                    $this->toMinorUnits(
                        (string) $item->price_snapshot,
                    ) * (int) $item->quantity,
                );

                /*
                 * Kurangi stok setelah semua item valid.
                 */
                foreach ($cartItems as $item) {
                    $sku = $skus->get(
                        $item->product_sku_id,
                    );

                    $sku->stock =
                        (int) $sku->stock -
                        (int) $item->quantity;

                    $sku->save();
                }

                /*
                 * Buat master order.
                 */
                $order = Order::query()->create([
                    'customer_id' =>
                    $customer->id,

                    'grand_total' =>
                    $this->toDecimalString(
                        $grandTotalMinor,
                    ),

                    'payment_status' =>
                    'unpaid',

                    'expires_at' =>
                    now()->addMinutes(10),
                ]);

                /*
                 * Kelompokkan item berdasarkan vendor.
                 */
                $itemsByVendor = $cartItems->groupBy(
                    function (
                        CartItem $item,
                    ) use ($skus): int {
                        return (int) $skus
                            ->get(
                                $item->product_sku_id,
                            )
                            ->product
                            ->vendor_id;
                    },
                );

                foreach (
                    $itemsByVendor
                    as $vendorId => $items
                ) {
                    $vendorSubtotalMinor = $items->sum(
                        fn(CartItem $item): int =>
                        $this->toMinorUnits(
                            (string) $item->price_snapshot,
                        ) * (int) $item->quantity,
                    );

                    $vendorOrder = $order
                        ->vendorOrders()
                        ->create([
                            'vendor_id' =>
                            $vendorId,

                            'subtotal' =>
                            $this->toDecimalString(
                                $vendorSubtotalMinor,
                            ),

                            'shipping_cost' =>
                            '0.00',

                            'delivery_status' =>
                            'pending',
                        ]);

                    /*
                     * Simpan harga normal, harga akhir,
                     * potongan, dan informasi promo.
                     */
                    $orderItems = $items
                        ->map(
                            function (
                                CartItem $item,
                            ) use (
                                $pricingSnapshots,
                            ): array {
                                $pricing =
                                    $pricingSnapshots[(int) $item->id];

                                $promotion =
                                    $pricing['promotion'];

                                $originalPriceMinor =
                                    $this->toMinorUnits(
                                        (string) $pricing['original_unit_price'],
                                    );

                                $finalPriceMinor =
                                    $this->toMinorUnits(
                                        (string) $pricing['final_unit_price'],
                                    );

                                /*
                                 * discount_amount disimpan
                                 * sebagai potongan per unit.
                                 */
                                $unitDiscountMinor = max(
                                    0,
                                    $originalPriceMinor -
                                        $finalPriceMinor,
                                );

                                return [
                                    'product_sku_id' =>
                                    $item->product_sku_id,

                                    'quantity' =>
                                    (int) $item->quantity,

                                    /*
                                     * Harga akhir setelah promo.
                                     */
                                    'price' =>
                                    (string) $pricing['final_unit_price'],

                                    /*
                                     * Harga asli sebelum promo.
                                     */
                                    'original_price' =>
                                    (string) $pricing['original_unit_price'],

                                    /*
                                     * Potongan untuk satu unit.
                                     */
                                    'discount_amount' =>
                                    $this->toDecimalString(
                                        $unitDiscountMinor,
                                    ),

                                    'promotion_id' =>
                                    $promotion['id']
                                        ?? null,

                                    'promotion_name' =>
                                    $promotion['name']
                                        ?? null,

                                    'promotion_discount_type' =>
                                    $promotion['discount_type']
                                        ?? null,

                                    'promotion_discount_value' =>
                                    $promotion['discount_value']
                                        ?? null,
                                ];
                            },
                        )
                        ->values()
                        ->all();

                    $vendorOrder
                        ->items()
                        ->createMany(
                            $orderItems,
                        );
                }

                /*
                 * Keranjang dikosongkan setelah seluruh
                 * order berhasil dibuat.
                 */
                $cart
                    ->items()
                    ->delete();

                return $order->load([
                    'vendorOrders.vendor',

                    'vendorOrders.items.productSku.product',
                ]);
            },
            attempts: 5,
        );
    }

    private function toMinorUnits(
        string $amount,
    ): int {
        [$whole, $fraction] = array_pad(
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

    private function toDecimalString(
        int $amount,
    ): string {
        $whole = intdiv(
            $amount,
            100,
        );

        $fraction = abs(
            $amount % 100,
        );

        return sprintf(
            '%d.%02d',
            $whole,
            $fraction,
        );
    }
}
