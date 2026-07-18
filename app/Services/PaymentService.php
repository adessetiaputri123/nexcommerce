<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly TransactionNotificationService $transactionNotificationService,
    ) {}

    public function pay(
        Order $order,
        User $actor,
    ): Order {
        /*
         * Nilai ini hanya menjadi true ketika pembayaran
         * baru saja berhasil diproses.
         *
         * Jika order sebelumnya sudah paid, notifikasi
         * tidak akan dibuat ulang.
         */
        $paymentCompletedNow = false;

        $paidOrder = DB::transaction(
            function () use (
                $order,
                $actor,
                &$paymentCompletedNow,
            ): Order {
                $lockedOrder = Order::query()
                    ->with('vendorOrders')
                    ->whereKey($order->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Service tetap memeriksa pemilik order,
                 * meskipun controller sudah memakai policy.
                 */
                if (
                    (int) $lockedOrder->customer_id
                    !== (int) $actor->id
                ) {
                    throw new AuthorizationException(
                        'Anda tidak memiliki akses untuk membayar pesanan ini.',
                    );
                }

                /*
                 * Idempotent:
                 * pembayaran yang sudah berhasil tidak
                 * diproses dan tidak dicatat dua kali.
                 */
                if (
                    $lockedOrder->payment_status
                    === 'paid'
                ) {
                    return $lockedOrder->fresh([
                        'vendorOrders',
                    ]);
                }

                if (
                    $lockedOrder->payment_status
                    !== 'unpaid'
                ) {
                    throw ValidationException::withMessages([
                        'payment' =>
                        'Pesanan ini tidak dapat dibayar.',
                    ]);
                }

                if (
                    $lockedOrder->expires_at !== null
                    && $lockedOrder->expires_at->isPast()
                ) {
                    throw ValidationException::withMessages([
                        'payment' =>
                        'Batas waktu pembayaran sudah berakhir.',
                    ]);
                }

                $paymentReference =
                    'SIM-' . Str::upper(
                        (string) Str::ulid(),
                    );

                $lockedOrder->update([
                    'payment_status' =>
                    'paid',

                    'payment_reference' =>
                    $paymentReference,

                    'paid_at' =>
                    now(),
                ]);

                /*
                 * Menandakan bahwa pembayaran benar-benar
                 * baru selesai pada proses ini.
                 */
                $paymentCompletedNow = true;

                /*
                 * Semua pesanan vendor mulai diproses
                 * setelah master order dibayar.
                 */
                $lockedOrder
                    ->vendorOrders()
                    ->where(
                        'delivery_status',
                        'pending',
                    )
                    ->update([
                        'delivery_status' =>
                        'confirmed',
                    ]);

                $lockedOrder->load(
                    'vendorOrders',
                );

                /*
                 * Audit log dibuat di dalam transaksi
                 * pembayaran yang sama.
                 */
                $this->activityLogService->record(
                    action: ActivityLogService::PAYMENT_COMPLETED,

                    actor: $actor,

                    subject: $lockedOrder,

                    vendor: null,

                    description: "Pembayaran pesanan #{$lockedOrder->id} berhasil.",

                    properties: [
                        'order_id' =>
                        $lockedOrder->id,

                        'payment_reference' =>
                        $paymentReference,

                        'grand_total' =>
                        (string) $lockedOrder
                            ->grand_total,

                        'payment_status_before' =>
                        'unpaid',

                        'payment_status_after' =>
                        'paid',

                        'vendor_order_ids' =>
                        $lockedOrder
                            ->vendorOrders
                            ->pluck('id')
                            ->values()
                            ->all(),
                    ],
                );

                return $lockedOrder->fresh([
                    'vendorOrders',
                ]);
            },
            attempts: 5,
        );

        /*
         * Notifikasi dikirim setelah transaksi database
         * berhasil diselesaikan.
         */
        if ($paymentCompletedNow) {
            $this
                ->transactionNotificationService
                ->paymentCompleted(
                    $paidOrder,
                );
        }

        return $paidOrder;
    }
}
