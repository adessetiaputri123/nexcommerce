<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use App\Notifications\SystemNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use App\Models\WithdrawalRequest;
use App\Models\VendorOrder;

class TransactionNotificationService
{
    public function paymentCompleted(
        Order $order,
    ): void {
        $this->notifyCustomer(
            $order,
        );

        $this->notifyVendors(
            $order,
        );
    }

    public function vendorOrderStatusChanged(
        VendorOrder $vendorOrder,
        string $statusBefore,
        string $statusAfter,
    ): void {
        $vendorOrder->loadMissing([
            'order',
            'vendor',
        ]);

        $order = $vendorOrder->order;

        if (!$order) {
            return;
        }

        $customer = User::query()
            ->find($order->customer_id);

        if (!$customer) {
            return;
        }

        $statusLabels = [
            'pending' =>
            'Menunggu',

            'confirmed' =>
            'Dikonfirmasi',

            'processing' =>
            'Sedang Diproses',

            'packed' =>
            'Sudah Dikemas',

            'shipped' =>
            'Sedang Dikirim',

            'completed' =>
            'Selesai',

            'cancelled' =>
            'Dibatalkan',

            'expired' =>
            'Kedaluwarsa',
        ];

        $vendorName =
            $vendorOrder->vendor?->shop_name
            ?? 'Vendor';

        $statusLabel =
            $statusLabels[$statusAfter]
            ?? $statusAfter;

        $level = match ($statusAfter) {
            'completed' =>
            'success',

            'cancelled',
            'expired' =>
            'danger',

            default =>
            'info',
        };

        $customer->notify(
            new SystemNotification(
                title: 'Status Pesanan Diperbarui',

                message: "Pesanan #{$order->id} dari {$vendorName} sekarang berstatus {$statusLabel}.",

                url: route(
                    'orders.show',
                    $order,
                ),

                level: $level,

                meta: [
                    'order_id' =>
                    $order->id,

                    'vendor_order_id' =>
                    $vendorOrder->id,

                    'vendor_id' =>
                    $vendorOrder->vendor_id,

                    'vendor_name' =>
                    $vendorName,

                    'status_before' =>
                    $statusBefore,

                    'status_after' =>
                    $statusAfter,
                ],
            ),
        );
    }

    public function withdrawalRequested(
        WithdrawalRequest $withdrawal,
    ): void {
        $withdrawal->loadMissing([
            'wallet.vendor',
            'requester',
        ]);

        $vendor =
            $withdrawal->wallet?->vendor;

        $requester =
            $withdrawal->requester;

        $vendorName =
            $vendor?->shop_name
            ?? 'Vendor';

        /*
     * Konfirmasi untuk pengguna
     * yang mengajukan penarikan.
     */
        if ($requester) {
            $requester->notify(
                new SystemNotification(
                    title: 'Pengajuan Penarikan Berhasil',

                    message: "Pengajuan {$withdrawal->request_code} sebesar Rp "
                        . number_format(
                            (float) $withdrawal->amount,
                            0,
                            ',',
                            '.',
                        )
                        . ' berhasil dikirim dan sedang menunggu pemeriksaan admin.',

                    url: route(
                        'vendor.wallet.index',
                    ),

                    level: 'success',

                    meta: [
                        'withdrawal_request_id' =>
                        $withdrawal->id,

                        'request_code' =>
                        $withdrawal->request_code,

                        'vendor_id' =>
                        $vendor?->id,

                        'vendor_name' =>
                        $vendorName,

                        'amount' =>
                        (string) $withdrawal->amount,

                        'status' =>
                        $withdrawal->status,
                    ],
                ),
            );
        }

        /*
     * Pemberitahuan untuk admin.
     */
        $admins = User::query()
            ->whereIn(
                'role',
                [
                    'admin',
                    'super_admin',
                ],
            )
            ->get();

        if ($admins->isEmpty()) {
            return;
        }

        Notification::send(
            $admins,
            new SystemNotification(
                title: 'Pengajuan Penarikan Baru',

                message: "{$vendorName} mengajukan penarikan {$withdrawal->request_code} sebesar Rp "
                    . number_format(
                        (float) $withdrawal->amount,
                        0,
                        ',',
                        '.',
                    )
                    . '.',

                url: route(
                    'admin.withdrawals.index',
                ),

                level: 'warning',

                meta: [
                    'withdrawal_request_id' =>
                    $withdrawal->id,

                    'request_code' =>
                    $withdrawal->request_code,

                    'vendor_id' =>
                    $vendor?->id,

                    'vendor_name' =>
                    $vendorName,

                    'requested_by' =>
                    $requester?->id,

                    'amount' =>
                    (string) $withdrawal->amount,

                    'status' =>
                    $withdrawal->status,
                ],
            ),
        );
    }

    public function withdrawalStatusChanged(
        WithdrawalRequest $withdrawal,
        string $statusBefore,
        string $statusAfter,
    ): void {
        $withdrawal->loadMissing([
            'wallet.vendor.owner',
            'requester',
        ]);

        $recipient =
            $withdrawal->requester
            ?? $withdrawal
            ->wallet
            ?->vendor
            ?->owner;

        if (!$recipient) {
            return;
        }

        $amount = number_format(
            (float) $withdrawal->amount,
            0,
            ',',
            '.',
        );

        $title = match ($statusAfter) {
            'approved' =>
            'Penarikan Disetujui',

            'rejected' =>
            'Penarikan Ditolak',

            'paid' =>
            'Penarikan Sudah Dibayar',

            default =>
            'Status Penarikan Diperbarui',
        };

        $message = match ($statusAfter) {
            'approved' =>
            "Pengajuan {$withdrawal->request_code} sebesar Rp {$amount} telah disetujui admin.",

            'rejected' =>
            "Pengajuan {$withdrawal->request_code} sebesar Rp {$amount} ditolak. Saldo telah dikembalikan ke wallet.",

            'paid' =>
            "Pengajuan {$withdrawal->request_code} sebesar Rp {$amount} telah ditandai sudah dibayar.",

            default =>
            "Status pengajuan {$withdrawal->request_code} telah diperbarui.",
        };

        $level = match ($statusAfter) {
            'approved' =>
            'info',

            'rejected' =>
            'danger',

            'paid' =>
            'success',

            default =>
            'info',
        };

        $recipient->notify(
            new SystemNotification(
                title: $title,

                message: $message,

                url: route(
                    'vendor.wallet.index',
                ),

                level: $level,

                meta: [
                    'withdrawal_request_id' =>
                    $withdrawal->id,

                    'request_code' =>
                    $withdrawal->request_code,

                    'wallet_id' =>
                    $withdrawal->wallet_id,

                    'vendor_id' =>
                    $withdrawal
                        ->wallet
                        ?->vendor_id,

                    'amount' =>
                    (string) $withdrawal->amount,

                    'status_before' =>
                    $statusBefore,

                    'status_after' =>
                    $statusAfter,

                    'review_note' =>
                    $withdrawal->review_note,

                    'reviewed_at' =>
                    $withdrawal
                        ->reviewed_at
                        ?->toIso8601String(),

                    'paid_at' =>
                    $withdrawal
                        ->paid_at
                        ?->toIso8601String(),
                ],
            ),
        );
    }

    private function notifyCustomer(
        Order $order,
    ): void {
        $customer = User::query()
            ->find(
                $order->customer_id,
            );

        if (!$customer) {
            return;
        }

        $customer->notify(
            new SystemNotification(
                title: 'Pembayaran Berhasil',

                message: "Pembayaran pesanan #{$order->id} berhasil diterima.",

                url: route(
                    'orders.show',
                    $order,
                ),

                level: 'success',

                meta: [
                    'order_id' =>
                    $order->id,

                    'payment_reference' =>
                    $order
                        ->payment_reference,

                    'grand_total' =>
                    (string) $order
                        ->grand_total,

                    'payment_status' =>
                    $order
                        ->payment_status,
                ],
            ),
        );
    }

    private function notifyVendors(
        Order $order,
    ): void {
        $vendorIds = $order
            ->vendorOrders()
            ->pluck('vendor_id')
            ->unique()
            ->values();

        if ($vendorIds->isEmpty()) {
            return;
        }

        $ownerIds = Vendor::query()
            ->whereIn(
                'id',
                $vendorIds,
            )
            ->pluck('owner_id')
            ->filter()
            ->unique()
            ->values();

        $recipients = $this->vendorRecipients(
            vendorIds: $vendorIds,
            ownerIds: $ownerIds,
        );

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send(
            $recipients,
            new SystemNotification(
                title: 'Pesanan Baru Dibayar',

                message: "Pesanan #{$order->id} sudah dibayar dan siap diproses.",

                url: route(
                    'vendor.orders.index',
                ),

                level: 'info',

                meta: [
                    'order_id' =>
                    $order->id,

                    'payment_reference' =>
                    $order
                        ->payment_reference,

                    'payment_status' =>
                    $order
                        ->payment_status,
                ],
            ),
        );
    }

    private function vendorRecipients(
        Collection $vendorIds,
        Collection $ownerIds,
    ): Collection {
        return User::query()
            ->whereIn(
                'role',
                [
                    'vendor_owner',
                    'vendor_staff',
                ],
            )
            ->where(
                function ($query) use (
                    $vendorIds,
                    $ownerIds,
                ): void {
                    $query
                        ->whereIn(
                            'vendor_id',
                            $vendorIds,
                        )
                        ->orWhereIn(
                            'id',
                            $ownerIds,
                        );
                },
            )
            ->get()
            ->unique('id')
            ->values();
    }
}
