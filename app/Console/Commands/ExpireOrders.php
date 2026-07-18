<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\ExpireOrderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class ExpireOrders extends Command
{
    /**
     * Nama perintah Artisan.
     */
    protected $signature = 'orders:expire';

    /**
     * Deskripsi perintah.
     */
    protected $description =
    'Mengakhiri pesanan yang melewati batas pembayaran dan mengembalikan stok';

    /**
     * Jalankan perintah.
     */
    public function handle(
        ExpireOrderService $expireOrderService,
    ): int {
        $expiredCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        Order::query()
            ->where('payment_status', 'unpaid')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereNull('stock_restored_at')
            ->orderBy('id')
            ->chunkById(
                100,
                function ($orders) use (
                    $expireOrderService,
                    &$expiredCount,
                    &$skippedCount,
                    &$failedCount,
                ): void {
                    foreach ($orders as $order) {
                        try {
                            $expired =
                                $expireOrderService
                                ->expire($order);

                            if ($expired) {
                                $expiredCount++;

                                $this->line(
                                    "Pesanan #{$order->id} "
                                        . 'berhasil di-expire.',
                                );

                                continue;
                            }

                            $skippedCount++;
                        } catch (Throwable $exception) {
                            $failedCount++;

                            Log::error(
                                'Gagal mengakhiri pesanan',
                                [
                                    'order_id' => $order->id,
                                    'message' =>
                                    $exception->getMessage(),
                                ],
                            );

                            $this->error(
                                "Pesanan #{$order->id} gagal: "
                                    . $exception->getMessage(),
                            );
                        }
                    }
                },
            );

        $this->newLine();

        $this->info(
            "Pesanan expired: {$expiredCount}",
        );

        $this->line(
            "Pesanan dilewati: {$skippedCount}",
        );

        $this->line(
            "Pesanan gagal: {$failedCount}",
        );

        return $failedCount > 0
            ? self::FAILURE
            : self::SUCCESS;
    }
}
