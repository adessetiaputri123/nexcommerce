<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use App\Models\WithdrawalRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WithdrawalReviewService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly TransactionNotificationService $transactionNotificationService,
    ) {}

    public function approve(
        WithdrawalRequest $withdrawal,
        User $reviewer,
        ?string $reviewNote = null,
    ): WithdrawalRequest {
        $this->ensureAdmin($reviewer);

        $reviewedWithdrawal = DB::transaction(
            function () use (
                $withdrawal,
                $reviewer,
                $reviewNote,
            ): WithdrawalRequest {
                $lockedWithdrawal = WithdrawalRequest::query()
                    ->whereKey($withdrawal->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedWithdrawal->status !== 'pending') {
                    throw ValidationException::withMessages([
                        'action' =>
                        'Hanya penarikan berstatus menunggu yang dapat disetujui.',
                    ]);
                }

                $lockedWithdrawal->update([
                    'status' => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'review_note' => $reviewNote,
                    'reviewed_at' => now(),
                ]);

                $lockedWithdrawal->loadMissing(
                    'wallet.vendor',
                );

                $this->activityLogService->record(
                    action: ActivityLogService::WITHDRAWAL_APPROVED,

                    actor: $reviewer,

                    subject: $lockedWithdrawal,

                    vendor: $lockedWithdrawal->wallet->vendor,

                    description: "Penarikan {$lockedWithdrawal->request_code} disetujui.",

                    properties: [
                        'withdrawal_request_id' =>
                        $lockedWithdrawal->id,

                        'request_code' =>
                        $lockedWithdrawal->request_code,

                        'wallet_id' =>
                        $lockedWithdrawal->wallet_id,

                        'vendor_id' =>
                        $lockedWithdrawal
                            ->wallet
                            ->vendor_id,

                        'amount' =>
                        (string) $lockedWithdrawal->amount,

                        'status_before' =>
                        'pending',

                        'status_after' =>
                        'approved',

                        'review_note' =>
                        $reviewNote,
                    ],
                );

                return $lockedWithdrawal->fresh([
                    'wallet.vendor',
                    'requester',
                    'reviewer',
                ]);
            },
            attempts: 5,
        );

        $this
            ->transactionNotificationService
            ->withdrawalStatusChanged(
                withdrawal: $reviewedWithdrawal,

                statusBefore: 'pending',

                statusAfter: 'approved',
            );

        return $reviewedWithdrawal;
    }

    public function reject(
        WithdrawalRequest $withdrawal,
        User $reviewer,
        string $reviewNote,
    ): WithdrawalRequest {
        $this->ensureAdmin($reviewer);

        $reviewedWithdrawal = DB::transaction(
            function () use (
                $withdrawal,
                $reviewer,
                $reviewNote,
            ): WithdrawalRequest {
                $lockedWithdrawal = WithdrawalRequest::query()
                    ->whereKey($withdrawal->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedWithdrawal->status !== 'pending') {
                    throw ValidationException::withMessages([
                        'action' =>
                        'Hanya penarikan berstatus menunggu yang dapat ditolak.',
                    ]);
                }

                $wallet = Wallet::query()
                    ->whereKey($lockedWithdrawal->wallet_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $idempotencyKey =
                    "withdrawal-request:"
                    . "{$lockedWithdrawal->id}:rejection-refund";

                $existingRefund = WalletLedgerEntry::query()
                    ->where(
                        'idempotency_key',
                        $idempotencyKey,
                    )
                    ->first();

                if (!$existingRefund) {
                    $amountMinor = $this->toMinorUnits(
                        (string) $lockedWithdrawal->amount,
                    );

                    $balanceBeforeMinor =
                        $this->toMinorUnits(
                            (string) $wallet->balance,
                        );

                    $balanceAfterMinor =
                        $balanceBeforeMinor + $amountMinor;

                    $amount = $this->toDecimalString(
                        $amountMinor,
                    );

                    $balanceBefore =
                        $this->toDecimalString(
                            $balanceBeforeMinor,
                        );

                    $balanceAfter =
                        $this->toDecimalString(
                            $balanceAfterMinor,
                        );

                    $wallet->update([
                        'balance' => $balanceAfter,
                    ]);

                    WalletLedgerEntry::query()->create([
                        'wallet_id' =>
                        $wallet->id,

                        'vendor_order_id' =>
                        null,

                        'withdrawal_request_id' =>
                        $lockedWithdrawal->id,

                        'entry_type' =>
                        'credit',

                        'amount' =>
                        $amount,

                        'balance_before' =>
                        $balanceBefore,

                        'balance_after' =>
                        $balanceAfter,

                        'idempotency_key' =>
                        $idempotencyKey,

                        'description' =>
                        "Pengembalian saldo penarikan "
                            . "{$lockedWithdrawal->request_code}",
                    ]);
                }

                $lockedWithdrawal->update([
                    'status' => 'rejected',
                    'reviewed_by' => $reviewer->id,
                    'review_note' => $reviewNote,
                    'reviewed_at' => now(),
                ]);

                $lockedWithdrawal->loadMissing(
                    'wallet.vendor',
                );

                $this->activityLogService->record(
                    action: ActivityLogService::WITHDRAWAL_REJECTED,

                    actor: $reviewer,

                    subject: $lockedWithdrawal,

                    vendor: $lockedWithdrawal->wallet->vendor,

                    description: "Penarikan {$lockedWithdrawal->request_code} ditolak dan saldo dikembalikan.",

                    properties: [
                        'withdrawal_request_id' =>
                        $lockedWithdrawal->id,

                        'request_code' =>
                        $lockedWithdrawal->request_code,

                        'wallet_id' =>
                        $lockedWithdrawal->wallet_id,

                        'vendor_id' =>
                        $lockedWithdrawal
                            ->wallet
                            ->vendor_id,

                        'amount' =>
                        (string) $lockedWithdrawal->amount,

                        'status_before' =>
                        'pending',

                        'status_after' =>
                        'rejected',

                        'review_note' =>
                        $reviewNote,

                        'refund_idempotency_key' =>
                        $idempotencyKey,
                    ],
                );

                return $lockedWithdrawal->fresh([
                    'wallet.vendor',
                    'requester',
                    'reviewer',
                ]);
            },
            attempts: 5,
        );

        $this
            ->transactionNotificationService
            ->withdrawalStatusChanged(
                withdrawal: $reviewedWithdrawal,

                statusBefore: 'pending',

                statusAfter: 'rejected',
            );

        return $reviewedWithdrawal;
    }

    public function markAsPaid(
        WithdrawalRequest $withdrawal,
        User $reviewer,
    ): WithdrawalRequest {
        $this->ensureAdmin($reviewer);

        $reviewedWithdrawal = DB::transaction(
            function () use (
                $withdrawal,
                $reviewer,
            ): WithdrawalRequest {
                $lockedWithdrawal = WithdrawalRequest::query()
                    ->whereKey($withdrawal->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedWithdrawal->status !== 'approved') {
                    throw ValidationException::withMessages([
                        'action' =>
                        'Hanya penarikan yang sudah disetujui yang dapat ditandai dibayar.',
                    ]);
                }

                $lockedWithdrawal->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $lockedWithdrawal->loadMissing(
                    'wallet.vendor',
                );

                $this->activityLogService->record(
                    action: ActivityLogService::WITHDRAWAL_PAID,

                    actor: $reviewer,

                    subject: $lockedWithdrawal,

                    vendor: $lockedWithdrawal->wallet->vendor,

                    description: "Penarikan {$lockedWithdrawal->request_code} ditandai sudah dibayar.",

                    properties: [
                        'withdrawal_request_id' =>
                        $lockedWithdrawal->id,

                        'request_code' =>
                        $lockedWithdrawal->request_code,

                        'wallet_id' =>
                        $lockedWithdrawal->wallet_id,

                        'vendor_id' =>
                        $lockedWithdrawal
                            ->wallet
                            ->vendor_id,

                        'amount' =>
                        (string) $lockedWithdrawal->amount,

                        'status_before' =>
                        'approved',

                        'status_after' =>
                        'paid',

                        'paid_at' =>
                        $lockedWithdrawal
                            ->paid_at
                            ?->toIso8601String(),
                    ],
                );

                return $lockedWithdrawal->fresh([
                    'wallet.vendor',
                    'requester',
                    'reviewer',
                ]);
            },
            attempts: 5,
        );

        $this
            ->transactionNotificationService
            ->withdrawalStatusChanged(
                withdrawal: $reviewedWithdrawal,

                statusBefore: 'approved',

                statusAfter: 'paid',
            );

        return $reviewedWithdrawal;
    }

    private function ensureAdmin(
        User $user,
    ): void {
        if (
            !in_array(
                (string) $user->role,
                [
                    'admin',
                    'super_admin',
                ],
                true,
            )
        ) {
            throw new AuthorizationException(
                'Hanya admin yang dapat memproses penarikan.',
            );
        }
    }

    private function toMinorUnits(
        string $amount,
    ): int {
        [$whole, $fraction] = array_pad(
            explode('.', $amount, 2),
            2,
            '0',
        );

        $fraction = str_pad(
            substr($fraction, 0, 2),
            2,
            '0',
        );

        return ((int) $whole * 100)
            + (int) $fraction;
    }

    private function toDecimalString(
        int $amount,
    ): string {
        $whole = intdiv($amount, 100);
        $fraction = $amount % 100;

        return sprintf(
            '%d.%02d',
            $whole,
            $fraction,
        );
    }
}
