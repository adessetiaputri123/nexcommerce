<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalReviewService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class WithdrawalReviewServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_pending_withdrawal(): void
    {
        $data = $this->createPendingWithdrawal();

        $withdrawal = app(
            WithdrawalReviewService::class,
        )->approve(
            withdrawal: $data['withdrawal'],
            reviewer: $data['admin'],
            reviewNote: 'Data rekening sudah sesuai.',
        );

        $this->assertSame(
            'approved',
            $withdrawal->status,
        );

        $this->assertSame(
            $data['admin']->id,
            $withdrawal->reviewed_by,
        );

        $this->assertSame(
            'Data rekening sudah sesuai.',
            $withdrawal->review_note,
        );

        $this->assertNotNull(
            $withdrawal->reviewed_at,
        );

        /*
         * Approval tidak mengubah saldo lagi
         * karena saldo sudah dikurangi ketika
         * vendor mengajukan penarikan.
         */
        $this->assertSame(
            '750000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseHas(
            'withdrawal_requests',
            [
                'id' => $withdrawal->id,
                'status' => 'approved',
                'reviewed_by' => $data['admin']->id,
            ],
        );
    }

    public function test_rejection_returns_balance_to_wallet(): void
    {
        $data = $this->createPendingWithdrawal();

        $withdrawal = app(
            WithdrawalReviewService::class,
        )->reject(
            withdrawal: $data['withdrawal'],
            reviewer: $data['admin'],
            reviewNote: 'Nomor rekening tidak valid.',
        );

        $this->assertSame(
            'rejected',
            $withdrawal->status,
        );

        $this->assertSame(
            '1000000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseHas(
            'wallet_ledger_entries',
            [
                'wallet_id' => $data['wallet']->id,

                'withdrawal_request_id' =>
                $data['withdrawal']->id,

                'entry_type' => 'credit',
                'amount' => '250000.00',
                'balance_before' => '750000.00',
                'balance_after' => '1000000.00',

                'idempotency_key' =>
                "withdrawal-request:"
                    . "{$data['withdrawal']->id}:rejection-refund",
            ],
        );
    }

    public function test_rejected_withdrawal_cannot_refund_twice(): void
    {
        $data = $this->createPendingWithdrawal();

        $service = app(
            WithdrawalReviewService::class,
        );

        $service->reject(
            withdrawal: $data['withdrawal'],
            reviewer: $data['admin'],
            reviewNote: 'Pengajuan ditolak.',
        );

        try {
            $service->reject(
                withdrawal: $data['withdrawal']->fresh(),

                reviewer: $data['admin'],

                reviewNote: 'Mencoba menolak kembali.',
            );

            $this->fail(
                'Penarikan yang sudah ditolak tidak boleh diproses kembali.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'action',
                $exception->errors(),
            );
        }

        $this->assertSame(
            '1000000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertSame(
            1,
            WalletLedgerEntry::query()
                ->where(
                    'idempotency_key',
                    "withdrawal-request:"
                        . "{$data['withdrawal']->id}:rejection-refund",
                )
                ->count(),
        );
    }

    public function test_approved_withdrawal_can_be_marked_as_paid(): void
    {
        $data = $this->createPendingWithdrawal();

        $service = app(
            WithdrawalReviewService::class,
        );

        $approved = $service->approve(
            withdrawal: $data['withdrawal'],
            reviewer: $data['admin'],
            reviewNote: 'Disetujui.',
        );

        $paid = $service->markAsPaid(
            withdrawal: $approved,
            reviewer: $data['admin'],
        );

        $this->assertSame(
            'paid',
            $paid->status,
        );

        $this->assertNotNull(
            $paid->paid_at,
        );

        $this->assertSame(
            '750000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseHas(
            'withdrawal_requests',
            [
                'id' => $paid->id,
                'status' => 'paid',
            ],
        );
    }

    public function test_non_admin_cannot_review_withdrawal(): void
    {
        $data = $this->createPendingWithdrawal();

        $otherUser = User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        try {
            app(
                WithdrawalReviewService::class,
            )->approve(
                withdrawal: $data['withdrawal'],
                reviewer: $otherUser,
                reviewNote: null,
            );

            $this->fail(
                'Pengguna non-admin seharusnya tidak dapat memproses penarikan.',
            );
        } catch (AuthorizationException $exception) {
            $this->assertNotEmpty(
                $exception->getMessage(),
            );
        }

        $this->assertSame(
            'pending',
            $data['withdrawal']->fresh()->status,
        );

        $this->assertSame(
            '750000.00',
            $data['wallet']->fresh()->balance,
        );
    }

    private function createPendingWithdrawal(): array
    {
        $owner = User::factory()->create([
            'name' => 'Pemilik Vendor',
            'role' => 'vendor_owner',
            'email_verified_at' => now(),
        ]);

        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $owner->id,
            'shop_name' => 'Toko Review Withdrawal',
        ]);

        /*
         * Saldo awal sebelum pengajuan adalah Rp1.000.000.
         * Vendor sudah mengajukan Rp250.000 sehingga
         * saldo tersisa Rp750.000.
         */
        $wallet = Wallet::forceCreate([
            'vendor_id' => $vendor->id,
            'balance' => '750000.00',
        ]);

        $withdrawal = WithdrawalRequest::forceCreate([
            'request_code' =>
            'WD-TEST-' . fake()->unique()->numerify(
                '########',
            ),

            'wallet_id' => $wallet->id,
            'requested_by' => $owner->id,
            'amount' => '250000.00',
            'status' => 'pending',
            'bank_name' => 'BCA',

            'bank_account_name' =>
            'Pemilik Vendor',

            'bank_account_number' =>
            '1234567890',

            'vendor_note' =>
            'Mohon segera diproses.',

            'reviewed_by' => null,
            'review_note' => null,
            'reviewed_at' => null,
            'paid_at' => null,
        ]);

        /*
         * Ledger debit dibuat untuk meniru proses
         * ketika vendor pertama kali mengajukan penarikan.
         */
        WalletLedgerEntry::forceCreate([
            'wallet_id' => $wallet->id,
            'vendor_order_id' => null,

            'withdrawal_request_id' =>
            $withdrawal->id,

            'entry_type' => 'debit',
            'amount' => '250000.00',
            'balance_before' => '1000000.00',
            'balance_after' => '750000.00',

            'idempotency_key' =>
            "withdrawal-request:"
                . "{$withdrawal->id}:debit",

            'description' =>
            "Pengajuan penarikan "
                . "{$withdrawal->request_code}",
        ]);

        return [
            'owner' => $owner,
            'admin' => $admin,
            'vendor' => $vendor,
            'wallet' => $wallet,
            'withdrawal' => $withdrawal,
        ];
    }
}
