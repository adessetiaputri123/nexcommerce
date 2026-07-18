<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VendorDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_owner_can_view_vendor_dashboard(): void
    {
        $owner = User::factory()->create([
            'name' => 'Pemilik Vendor',
            'role' => 'vendor_owner',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $owner->id,
            'shop_name' => 'Toko Pengujian',
        ]);

        $owner->forceFill([
            'vendor_id' => $vendor->id,
        ])->save();

        $response = $this
            ->actingAs($owner)
            ->get(
                route('vendor.dashboard'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Vendor/Dashboard',
                    )
                    ->where(
                        'vendor.id',
                        $vendor->id,
                    )
                    ->where(
                        'vendor.shop_name',
                        'Toko Pengujian',
                    )
                    ->where(
                        'stats.total_orders',
                        0,
                    )
                    ->where(
                        'stats.paid_orders',
                        0,
                    )
                    ->where(
                        'stats.completed_orders',
                        0,
                    )
                    ->where(
                        'stats.processing_orders',
                        0,
                    )
                    ->where(
                        'stats.pending_withdrawals',
                        0,
                    )
                    ->where(
                        'stats.gross_sales',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->where(
                        'stats.completed_sales',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->where(
                        'stats.wallet_balance',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->where(
                        'stats.pending_withdrawal_amount',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->has(
                        'recentOrders',
                        0,
                    )
                    ->has(
                        'recentWithdrawals',
                        0,
                    ),
            );
    }

    public function test_vendor_staff_can_view_vendor_dashboard(): void
    {
        $owner = User::factory()->create([
            'role' => 'vendor_owner',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $owner->id,
            'shop_name' => 'Toko Staff',
        ]);

        $staff = User::factory()->create([
            'name' => 'Staff Vendor',
            'role' => 'vendor_staff',
            'vendor_id' => $vendor->id,
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($staff)
            ->get(
                route('vendor.dashboard'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Vendor/Dashboard',
                    )
                    ->where(
                        'vendor.id',
                        $vendor->id,
                    )
                    ->where(
                        'vendor.shop_name',
                        'Toko Staff',
                    )
                    ->has('stats')
                    ->has('recentOrders')
                    ->has('recentWithdrawals'),
            );
    }

    public function test_customer_cannot_view_vendor_dashboard(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($customer)
            ->get(
                route('vendor.dashboard'),
            );

        $response->assertForbidden();
    }

    public function test_admin_cannot_view_vendor_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route('vendor.dashboard'),
            );

        $response->assertForbidden();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get(
            route('vendor.dashboard'),
        );

        $response->assertRedirect(
            route('login'),
        );
    }

    public function test_vendor_owner_without_vendor_is_forbidden(): void
    {
        $owner = User::factory()->create([
            'role' => 'vendor_owner',
            'vendor_id' => null,
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($owner)
            ->get(
                route('vendor.dashboard'),
            );

        $response->assertForbidden();
    }
}
