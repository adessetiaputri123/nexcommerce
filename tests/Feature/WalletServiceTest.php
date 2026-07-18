<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class WalletServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_completed_paid_vendor_order_credits_wallet(): void
    {
        $data = $this->createVendorOrderData(
            paymentStatus: 'paid',
            deliveryStatus: 'completed',
            walletBalance: '250000.00',
        );

        $entry = app(WalletService::class)
            ->creditCompletedVendorOrder(
                $data['vendorOrder'],
            );

        $wallet = $data['wallet']->fresh();

        $this->assertSame(
            '1750000.00',
            $wallet->balance,
        );

        $this->assertSame(
            'credit',
            $entry->entry_type,
        );

        $this->assertSame(
            '1500000.00',
            $entry->amount,
        );

        $this->assertSame(
            '250000.00',
            $entry->balance_before,
        );

        $this->assertSame(
            '1750000.00',
            $entry->balance_after,
        );

        $this->assertSame(
            $data['vendorOrder']->id,
            $entry->vendor_order_id,
        );

        $this->assertSame(
            "vendor-order:{$data['vendorOrder']->id}:completed-credit",
            $entry->idempotency_key,
        );

        $this->assertDatabaseHas(
            'wallet_ledger_entries',
            [
                'wallet_id' => $wallet->id,
                'vendor_order_id' =>
                $data['vendorOrder']->id,
                'entry_type' => 'credit',
                'amount' => '1500000.00',
                'balance_before' => '250000.00',
                'balance_after' => '1750000.00',
            ],
        );
    }

    public function test_vendor_order_is_not_credited_twice(): void
    {
        $data = $this->createVendorOrderData(
            paymentStatus: 'paid',
            deliveryStatus: 'completed',
        );

        $service = app(WalletService::class);

        $firstEntry =
            $service->creditCompletedVendorOrder(
                $data['vendorOrder'],
            );

        $secondEntry =
            $service->creditCompletedVendorOrder(
                $data['vendorOrder']->fresh(),
            );

        $this->assertSame(
            $firstEntry->id,
            $secondEntry->id,
        );

        $this->assertSame(
            '1500000.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseCount(
            'wallet_ledger_entries',
            1,
        );

        $this->assertSame(
            1,
            WalletLedgerEntry::query()
                ->where(
                    'vendor_order_id',
                    $data['vendorOrder']->id,
                )
                ->count(),
        );
    }

    public function test_unpaid_vendor_order_cannot_credit_wallet(): void
    {
        $data = $this->createVendorOrderData(
            paymentStatus: 'unpaid',
            deliveryStatus: 'completed',
        );

        try {
            app(WalletService::class)
                ->creditCompletedVendorOrder(
                    $data['vendorOrder'],
                );

            $this->fail(
                'Pesanan belum dibayar seharusnya tidak dapat mengisi wallet.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'wallet',
                $exception->errors(),
            );
        }

        $this->assertSame(
            '0.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseCount(
            'wallet_ledger_entries',
            0,
        );
    }

    public function test_uncompleted_vendor_order_cannot_credit_wallet(): void
    {
        $data = $this->createVendorOrderData(
            paymentStatus: 'paid',
            deliveryStatus: 'shipped',
        );

        try {
            app(WalletService::class)
                ->creditCompletedVendorOrder(
                    $data['vendorOrder'],
                );

            $this->fail(
                'Pesanan yang belum selesai seharusnya tidak dapat mengisi wallet.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'wallet',
                $exception->errors(),
            );
        }

        $this->assertSame(
            '0.00',
            $data['wallet']->fresh()->balance,
        );

        $this->assertDatabaseCount(
            'wallet_ledger_entries',
            0,
        );
    }

    private function createVendorOrderData(
        string $paymentStatus = 'paid',
        string $deliveryStatus = 'completed',
        string $walletBalance = '0.00',
    ): array {
        $customer = User::factory()->create([
            'name' => 'Customer Wallet',
            'email' => fake()
                ->unique()
                ->safeEmail(),

            'email_verified_at' => now(),
            'role' => 'customer',
            'vendor_id' => null,
        ]);

        $vendorOwner = User::factory()->create([
            'name' => 'Pemilik Toko Wallet',
            'email' => fake()
                ->unique()
                ->safeEmail(),

            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $vendorOwner->id,
            'shop_name' => 'Toko Wallet',
        ]);

        $order = Order::forceCreate([
            'customer_id' => $customer->id,
            'grand_total' => '1500000.00',
            'payment_status' => $paymentStatus,

            'payment_reference' =>
            $paymentStatus === 'paid'
                ? 'TEST-WALLET-' . fake()->uuid()
                : null,

            'paid_at' =>
            $paymentStatus === 'paid'
                ? now()
                : null,

            'expires_at' => now()->addMinutes(10),
            'expired_at' => null,
            'stock_restored_at' => null,
        ]);

        $vendorOrder = VendorOrder::forceCreate([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'subtotal' => '1500000.00',
            'shipping_cost' => '0.00',
            'delivery_status' => $deliveryStatus,
        ]);

        $wallet = Wallet::forceCreate([
            'vendor_id' => $vendor->id,
            'balance' => $walletBalance,
        ]);

        return [
            'customer' => $customer,
            'vendorOwner' => $vendorOwner,
            'vendor' => $vendor,
            'order' => $order,
            'vendorOrder' => $vendorOrder,
            'wallet' => $wallet,
        ];
    }
}
