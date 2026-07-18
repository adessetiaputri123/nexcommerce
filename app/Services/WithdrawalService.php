<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use App\Models\WithdrawalRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WithdrawalService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly TransactionNotificationService $transactionNotificationService,
    ) {}

    public function createRequest(
        Wallet $wallet,
        User $requester,
        array $data,
    ): WithdrawalRequest {
        /*
         * Simpan hasil transaksi terlebih dahulu.
         * Notifikasi dikirim setelah transaksi database
         * berhasil diselesaikan.
         */
        $createdWithdrawal = DB::transaction(
            function () use (
                $wallet,
                $requester,
                $data,
            ): WithdrawalRequest {
                /*
                 * Kunci wallet agar saldo tidak berubah
                 * bersamaan dengan transaksi lain.
                 */
                $lockedWallet = Wallet::query()
                    ->with('vendor')
                    ->whereKey($wallet->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Hanya pemilik vendor yang boleh
                 * menarik saldo.
                 */
                if (
                    (int) $lockedWallet->vendor->owner_id
                    !== (int) $requester->id
                ) {
                    throw new AuthorizationException(
                        'Anda tidak memiliki akses untuk menarik saldo ini.',
                    );
                }

                $amountMinor = $this->toMinorUnits(
                    (string) $data['amount'],
                );

                $balanceBeforeMinor =
                    $this->toMinorUnits(
                        (string) $lockedWallet->balance,
                    );

                if ($amountMinor <= 0) {
                    throw ValidationException::withMessages([
                        'amount' =>
                        'Nominal penarikan harus lebih dari nol.',
                    ]);
                }

                if (
                    $amountMinor
                    > $balanceBeforeMinor
                ) {
                    throw ValidationException::withMessages([
                        'amount' =>
                        'Saldo wallet tidak mencukupi.',
                    ]);
                }

                $balanceAfterMinor =
                    $balanceBeforeMinor - $amountMinor;

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

                /*
                 * Buat permintaan penarikan.
                 */
                $withdrawal = WithdrawalRequest::query()
                    ->create([
                        'request_code' =>
                        'WD-' . Str::upper(
                            (string) Str::ulid(),
                        ),

                        'wallet_id' =>
                        $lockedWallet->id,

                        'requested_by' =>
                        $requester->id,

                        'amount' =>
                        $amount,

                        'status' =>
                        'pending',

                        'bank_name' =>
                        $data['bank_name'],

                        'bank_account_name' =>
                        $data['bank_account_name'],

                        'bank_account_number' =>
                        $data['bank_account_number'],

                        'vendor_note' =>
                        $data['vendor_note'] ?? null,
                    ]);

                /*
                 * Kurangi saldo wallet.
                 */
                $lockedWallet->update([
                    'balance' =>
                    $balanceAfter,
                ]);

                /*
                 * Catat pengurangan saldo sebagai debit.
                 */
                WalletLedgerEntry::query()
                    ->create([
                        'wallet_id' =>
                        $lockedWallet->id,

                        'vendor_order_id' =>
                        null,

                        'withdrawal_request_id' =>
                        $withdrawal->id,

                        'entry_type' =>
                        'debit',

                        'amount' =>
                        $amount,

                        'balance_before' =>
                        $balanceBefore,

                        'balance_after' =>
                        $balanceAfter,

                        'idempotency_key' =>
                        "withdrawal-request:"
                            . "{$withdrawal->id}:debit",

                        'description' =>
                        "Pengajuan penarikan "
                            . "{$withdrawal->request_code}",
                    ]);

                /*
                 * Catat aktivitas penarikan.
                 */
                $this->activityLogService->record(
                    action: ActivityLogService::WITHDRAWAL_REQUESTED,

                    actor: $requester,

                    subject: $withdrawal,

                    vendor: $lockedWallet->vendor,

                    description: "Vendor mengajukan penarikan {$withdrawal->request_code}.",

                    properties: [
                        'withdrawal_request_id' =>
                        $withdrawal->id,

                        'request_code' =>
                        $withdrawal->request_code,

                        'wallet_id' =>
                        $lockedWallet->id,

                        'vendor_id' =>
                        $lockedWallet->vendor_id,

                        'amount' =>
                        $amount,

                        'balance_before' =>
                        $balanceBefore,

                        'balance_after' =>
                        $balanceAfter,

                        'bank_name' =>
                        $withdrawal->bank_name,

                        /*
                         * Nomor rekening penuh tidak disimpan
                         * dalam audit log.
                         */
                        'bank_account_last_four' =>
                        substr(
                            $withdrawal
                                ->bank_account_number,
                            -4,
                        ),

                        'status' =>
                        $withdrawal->status,
                    ],
                );

                return $withdrawal->load([
                    'wallet.vendor',
                    'requester',
                    'ledgerEntries',
                ]);
            },
            attempts: 5,
        );

        /*
         * Notifikasi dikirim setelah transaksi database
         * berhasil di-commit.
         */
        $this
            ->transactionNotificationService
            ->withdrawalRequested(
                $createdWithdrawal,
            );

        return $createdWithdrawal;
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
