<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductSku;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ExpireOrderService
{
    /**
     * Mengubah order unpaid yang telah melewati batas waktu
     * menjadi expired dan mengembalikan stok.
     */
    public function expire(Order $order): bool
    {
        return DB::transaction(
            function () use ($order): bool {
                /*
                 * Kunci order agar tidak diproses bersamaan.
                 */
                $lockedOrder = Order::query()
                    ->whereKey($order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Jangan proses order yang sudah dibayar,
                 * belum jatuh tempo, atau stoknya sudah kembali.
                 */
                if (
                    $lockedOrder->payment_status !== 'unpaid'
                    || !$lockedOrder->expires_at
                    || $lockedOrder->expires_at->isFuture()
                    || $lockedOrder->stock_restored_at
                ) {
                    return false;
                }

                /*
                 * Kunci seluruh order item milik master order.
                 */
                $orderItems = OrderItem::query()
                    ->whereHas(
                        'vendorOrder',
                        function ($query) use (
                            $lockedOrder,
                        ): void {
                            $query->where(
                                'order_id',
                                $lockedOrder->id,
                            );
                        },
                    )
                    ->orderBy('product_sku_id')
                    ->lockForUpdate()
                    ->get();

                /*
                 * Ambil dan urutkan semua ID SKU.
                 */
                $skuIds = $orderItems
                    ->pluck('product_sku_id')
                    ->unique()
                    ->sort()
                    ->values();

                /*
                 * Kunci SKU sebelum stok dikembalikan.
                 */
                $skus = ProductSku::query()
                    ->whereIn('id', $skuIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                /*
                 * Mencegah order dianggap selesai apabila
                 * terdapat data SKU yang tidak lengkap.
                 */
                if ($skus->count() !== $skuIds->count()) {
                    throw new RuntimeException(
                        'Data SKU pesanan tidak lengkap.',
                    );
                }

                /*
                 * Kembalikan stok setiap barang.
                 */
                foreach ($orderItems as $item) {
                    $sku = $skus->get(
                        $item->product_sku_id,
                    );

                    $sku->increment(
                        'stock',
                        $item->quantity,
                    );
                }

                $expiredAt = now();

                /*
                 * Batalkan pesanan pada setiap vendor.
                 */
                $lockedOrder
                    ->vendorOrders()
                    ->update([
                        'delivery_status' => 'cancelled',
                    ]);

                /*
                 * Tandai order sudah expired dan stok
                 * telah dikembalikan.
                 */
                $lockedOrder->update([
                    'payment_status' => 'expired',
                    'expired_at' => $expiredAt,
                    'stock_restored_at' => $expiredAt,
                ]);

                return true;
            },
            attempts: 5,
        );
    }
}
