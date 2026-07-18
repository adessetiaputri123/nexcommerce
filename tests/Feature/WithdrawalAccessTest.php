<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WithdrawalAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_withdrawal_page(): void
    {
        $data = $this->createWalletData();

        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $this->createPendingWithdrawal(
            wallet: $data['wallet'],
            owner: $data['owner'],
        );

        $response = $this
            ->actingAs($admin)
            ->get(
                route('admin.withdrawals.index'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/Withdrawals/Index',
                    )
                    ->has('withdrawals.data', 1)
                    ->where(
                        'withdrawals.data.0.status',
                        'pending',
                    ),
            );
    }

    public function test_non_admin_cannot_view_withdrawal_page(): void
    {
        $data = $this->createWalletData();

        $response = $this
            ->actingAs($data['owner'])
            ->get(
                route('admin.withdrawals.index'),
            );

        $response->assertForbidden();
    }

    public function test_vendor_owner_can_submit_withdrawal(): void
    {
        $data = $this->createWalletData(
            balance: '500000.00',
        );

        $response = $this
            ->actingAs($data['owner'])
            ->post(
                route(
                    'vendor.wallet.withdrawals.store',
                    $data['wallet'],
                ),
                [
                    'amount' => '100000',
                    'bank_name' => 'BCA',

                    'bank_account_name' =>
                    'Pemilik Vendor',

                    'bank_account_number' =>
                    '1234567890',

                    'vendor_note' =>
                    'Mohon segera diproses.',
                ],
            );

        $response
            ->assertRedirect()
            ->assertSessionHas('message');

        $this->assertSame(
            '400000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseHas(
            'withdrawal_requests',
            [
                'wallet_id' =>
                $data['wallet']->id,

                'requested_by' =>
                $data['owner']->id,

                'amount' => '100000.00',
                'status' => 'pending',
                'bank_name' => 'BCA',

                'bank_account_number' =>
                '1234567890',
            ],
        );

        $this->assertDatabaseHas(
            'wallet_ledger_entries',
            [
                'wallet_id' =>
                $data['wallet']->id,

                'entry_type' => 'debit',
                'amount' => '100000.00',

                'balance_before' =>
                '500000.00',

                'balance_after' =>
                '400000.00',
            ],
        );
    }

    public function test_vendor_staff_cannot_submit_withdrawal(): void
    {
        $data = $this->createWalletData(
            balance: '500000.00',
        );

        $staff = User::factory()->create([
            'name' => 'Staff Vendor',
            'role' => 'vendor_staff',
            'vendor_id' => $data['vendor']->id,
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($staff)
            ->post(
                route(
                    'vendor.wallet.withdrawals.store',
                    $data['wallet'],
                ),
                [
                    'amount' => '100000',
                    'bank_name' => 'BRI',

                    'bank_account_name' =>
                    'Staff Vendor',

                    'bank_account_number' =>
                    '9876543210',

                    'vendor_note' => null,
                ],
            );

        $response->assertForbidden();

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

    public function test_super_admin_can_approve_withdrawal_through_route(): void
    {
        $data = $this->createWalletData(
            balance: '400000.00',
        );

        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $withdrawal = $this->createPendingWithdrawal(
            wallet: $data['wallet'],
            owner: $data['owner'],
        );

        $response = $this
            ->actingAs($admin)
            ->patch(
                route(
                    'admin.withdrawals.update',
                    $withdrawal,
                ),
                [
                    'action' => 'approve',

                    'review_note' =>
                    'Data rekening sudah sesuai.',
                ],
            );

        $response
            ->assertRedirect()
            ->assertSessionHas(
                'message',
                'Penarikan berhasil disetujui.',
            );

        $this->assertDatabaseHas(
            'withdrawal_requests',
            [
                'id' => $withdrawal->id,
                'status' => 'approved',
                'reviewed_by' => $admin->id,

                'review_note' =>
                'Data rekening sudah sesuai.',
            ],
        );

        $this->assertNotNull(
            $withdrawal
                ->fresh()
                ->reviewed_at,
        );
    }

    private function createWalletData(
        string $balance = '500000.00',
    ): array {
        $owner = User::factory()->create([
            'name' => 'Pemilik Vendor',
            'role' => 'vendor_owner',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $owner->id,
            'shop_name' => 'Toko Pengujian',
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

    private function createPendingWithdrawal(
        Wallet $wallet,
        User $owner,
    ): WithdrawalRequest {
        return WithdrawalRequest::forceCreate([
            'request_code' =>
            'WD-ACCESS-' . fake()
                ->unique()
                ->numerify('########'),

            'wallet_id' => $wallet->id,
            'requested_by' => $owner->id,
            'amount' => '100000.00',
            'status' => 'pending',
            'bank_name' => 'BCA',

            'bank_account_name' =>
            'Pemilik Vendor',

            'bank_account_number' =>
            '1234567890',

            'vendor_note' => null,
            'reviewed_by' => null,
            'review_note' => null,
            'reviewed_at' => null,
            'paid_at' => null,
        ]);
    }
}
