<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class WithdrawalServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_owner_can_submit_withdrawal(): void
    {
        $data = $this->createWalletData(
            balance: '1000000.00',
        );

        $withdrawal = app(WithdrawalService::class)
            ->createRequest(
                wallet: $data['wallet'],
                requester: $data['owner'],
                data: [
                    'amount' => '250000',
                    'bank_name' => 'BCA',
                    'bank_account_name' => 'Pemilik Toko',
                    'bank_account_number' => '1234567890',
                    'vendor_note' => 'Penarikan pertama',
                ],
            );

        $wallet = $data['wallet']->fresh();

        $this->assertSame(
            '750000.00',
            $wallet->balance,
        );

        $this->assertSame(
            'pending',
            $withdrawal->status,
        );

        $this->assertSame(
            '250000.00',
            $withdrawal->amount,
        );

        $this->assertSame(
            $wallet->id,
            $withdrawal->wallet_id,
        );

        $this->assertSame(
            $data['owner']->id,
            $withdrawal->requested_by,
        );

        $this->assertDatabaseHas(
            'withdrawal_requests',
            [
                'id' => $withdrawal->id,
                'wallet_id' => $wallet->id,
                'requested_by' => $data['owner']->id,
                'amount' => '250000.00',
                'status' => 'pending',
                'bank_name' => 'BCA',
                'bank_account_number' => '1234567890',
            ],
        );

        $this->assertDatabaseHas(
            'wallet_ledger_entries',
            [
                'wallet_id' => $wallet->id,
                'withdrawal_request_id' => $withdrawal->id,
                'entry_type' => 'debit',
                'amount' => '250000.00',
                'balance_before' => '1000000.00',
                'balance_after' => '750000.00',
            ],
        );
    }

    public function test_withdrawal_creates_debit_ledger(): void
    {
        $data = $this->createWalletData(
            balance: '500000.00',
        );

        $withdrawal = app(WithdrawalService::class)
            ->createRequest(
                wallet: $data['wallet'],
                requester: $data['owner'],
                data: [
                    'amount' => '100000',
                    'bank_name' => 'BRI',
                    'bank_account_name' => 'Owner Vendor',
                    'bank_account_number' => '9876543210',
                    'vendor_note' => null,
                ],
            );

        $entry = WalletLedgerEntry::query()
            ->where(
                'withdrawal_request_id',
                $withdrawal->id,
            )
            ->firstOrFail();

        $this->assertSame(
            'debit',
            $entry->entry_type,
        );

        $this->assertSame(
            '100000.00',
            $entry->amount,
        );

        $this->assertSame(
            '500000.00',
            $entry->balance_before,
        );

        $this->assertSame(
            '400000.00',
            $entry->balance_after,
        );

        $this->assertSame(
            "withdrawal-request:{$withdrawal->id}:debit",
            $entry->idempotency_key,
        );
    }

    public function test_withdrawal_above_balance_is_rejected(): void
    {
        $data = $this->createWalletData(
            balance: '100000.00',
        );

        try {
            app(WithdrawalService::class)
                ->createRequest(
                    wallet: $data['wallet'],
                    requester: $data['owner'],
                    data: [
                        'amount' => '150000',
                        'bank_name' => 'BNI',
                        'bank_account_name' => 'Pemilik Vendor',
                        'bank_account_number' => '1112223334',
                        'vendor_note' => null,
                    ],
                );

            $this->fail(
                'Penarikan melebihi saldo seharusnya ditolak.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'amount',
                $exception->errors(),
            );
        }

        $this->assertSame(
            '100000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseCount(
            'withdrawal_requests',
            0,
        );

        $this->assertDatabaseCount(
            'wallet_ledger_entries',
            0,
        );
    }

    public function test_non_owner_cannot_withdraw_vendor_balance(): void
    {
        $data = $this->createWalletData(
            balance: '500000.00',
        );

        $otherUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        try {
            app(WithdrawalService::class)
                ->createRequest(
                    wallet: $data['wallet'],
                    requester: $otherUser,
                    data: [
                        'amount' => '100000',
                        'bank_name' => 'Mandiri',
                        'bank_account_name' => 'Pengguna Lain',
                        'bank_account_number' => '5556667778',
                        'vendor_note' => null,
                    ],
                );

            $this->fail(
                'Pengguna yang bukan pemilik vendor seharusnya ditolak.',
            );
        } catch (AuthorizationException $exception) {
            $this->assertNotEmpty(
                $exception->getMessage(),
            );
        }

        $this->assertSame(
            '500000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseCount(
            'withdrawal_requests',
            0,
        );

        $this->assertDatabaseCount(
            'wallet_ledger_entries',
            0,
        );
    }

    private function createWalletData(
        string $balance = '0.00',
    ): array {
        $owner = User::factory()->create([
            'name' => 'Pemilik Vendor',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $owner->id,
            'shop_name' => 'Toko Withdrawal',
        ]);

        $wallet = Wallet::forceCreate([
            'vendor_id' => $vendor->id,
            'balance' => $balance,
        ]);

        return [
            'owner' => $owner,
            'vendor' => $vendor,
            'wallet' => $wallet,
        ];
    }
}
