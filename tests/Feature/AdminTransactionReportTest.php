<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminTransactionReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_view_transaction_report(): void
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route(
                    'admin.reports.transactions.index',
                ),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/Reports/Transactions/Index',
                    )
                    ->has('orders.data', 0)
                    ->has('orders.links')
                    ->has('summary')
                    ->where(
                        'summary.total_orders',
                        0,
                    )
                    ->where(
                        'summary.paid_orders',
                        0,
                    )
                    ->where(
                        'summary.total_transaction_value',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->where(
                        'summary.paid_transaction_value',
                        fn($value) =>
                        (float) $value === 0.0,
                    )
                    ->where(
                        'filters.search',
                        '',
                    )
                    ->where(
                        'filters.payment_status',
                        '',
                    )
                    ->where(
                        'filters.date_from',
                        '',
                    )
                    ->where(
                        'filters.date_to',
                        '',
                    ),
            );
    }

    public function test_admin_can_download_transaction_csv(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route(
                    'admin.reports.transactions.export',
                ),
            );

        $response
            ->assertOk()
            ->assertDownload()
            ->assertHeader(
                'content-type',
                'text/csv; charset=UTF-8',
            );

        $content = $response->streamedContent();

        $this->assertStringContainsString(
            'ID Pesanan',
            $content,
        );

        $this->assertStringContainsString(
            'Referensi Pembayaran',
            $content,
        );

        $this->assertStringContainsString(
            'Status Pembayaran',
            $content,
        );

        $this->assertStringContainsString(
            'Total Transaksi',
            $content,
        );

        $this->assertStringContainsString(
            'Tanggal Dibuat',
            $content,
        );
    }

    public function test_customer_cannot_view_transaction_report(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($customer)
            ->get(
                route(
                    'admin.reports.transactions.index',
                ),
            );

        $response->assertForbidden();
    }

    public function test_customer_cannot_export_transaction_report(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($customer)
            ->get(
                route(
                    'admin.reports.transactions.export',
                ),
            );

        $response->assertForbidden();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this
            ->get(
                route(
                    'admin.reports.transactions.index',
                ),
            )
            ->assertRedirect(
                route('login'),
            );

        $this
            ->get(
                route(
                    'admin.reports.transactions.export',
                ),
            )
            ->assertRedirect(
                route('login'),
            );
    }

    public function test_invalid_payment_status_is_rejected(): void
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->from(
                route(
                    'admin.reports.transactions.index',
                ),
            )
            ->get(
                route(
                    'admin.reports.transactions.index',
                    [
                        'payment_status' =>
                        'status-tidak-valid',
                    ],
                ),
            );

        $response
            ->assertRedirect(
                route(
                    'admin.reports.transactions.index',
                ),
            )
            ->assertSessionHasErrors(
                'payment_status',
            );
    }

    public function test_end_date_cannot_be_before_start_date(): void
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin)
            ->from(
                route(
                    'admin.reports.transactions.index',
                ),
            )
            ->get(
                route(
                    'admin.reports.transactions.index',
                    [
                        'date_from' =>
                        '2026-07-17',

                        'date_to' =>
                        '2026-07-10',
                    ],
                ),
            );

        $response
            ->assertRedirect(
                route(
                    'admin.reports.transactions.index',
                ),
            )
            ->assertSessionHasErrors(
                'date_to',
            );
    }
}
