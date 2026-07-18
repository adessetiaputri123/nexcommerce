<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route('admin.dashboard'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/Dashboard',
                    )
                    ->has('stats')
                    ->where(
                        'stats.total_orders',
                        0,
                    )
                    ->where(
                        'stats.paid_orders',
                        0,
                    )
                    ->where(
                        'stats.unpaid_orders',
                        0,
                    )
                    ->where(
                        'stats.expired_orders',
                        0,
                    )
                    ->where(
                        'stats.total_vendors',
                        0,
                    )
                    ->where(
                        'stats.pending_withdrawals',
                        0,
                    )
                    ->has(
                        'recentActivities',
                        0,
                    )
                    ->has(
                        'recentWithdrawals',
                        0,
                    ),
            );
    }

    public function test_admin_can_view_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin',
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route('admin.dashboard'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/Dashboard',
                    )
                    ->has('stats')
                    ->has('recentActivities')
                    ->has('recentWithdrawals'),
            );
    }

    public function test_customer_cannot_view_admin_dashboard(): void
    {
        $customer = User::factory()->create([
            'name' => 'Customer',
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($customer)
            ->get(
                route('admin.dashboard'),
            );

        $response->assertForbidden();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get(
            route('admin.dashboard'),
        );

        $response->assertRedirect(
            route('login'),
        );
    }

    public function test_admin_dashboard_displays_recent_activity(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Audit',
            'email' => 'admin-audit@example.com',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        ActivityLog::forceCreate([
            'actor_id' => $admin->id,
            'vendor_id' => null,
            'action' => 'debug.dashboard',
            'subject_type' => null,
            'subject_id' => null,
            'description' =>
            'Aktivitas untuk dashboard admin.',
            'properties' => [
                'source' => 'feature-test',
            ],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route('admin.dashboard'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/Dashboard',
                    )
                    ->has(
                        'recentActivities',
                        1,
                    )
                    ->where(
                        'recentActivities.0.action',
                        'debug.dashboard',
                    )
                    ->where(
                        'recentActivities.0.description',
                        'Aktivitas untuk dashboard admin.',
                    )
                    ->where(
                        'recentActivities.0.actor.name',
                        'Admin Audit',
                    )
                    ->where(
                        'recentActivities.0.actor.email',
                        'admin-audit@example.com',
                    ),
            );
    }
}
