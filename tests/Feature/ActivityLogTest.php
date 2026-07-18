<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Vendor;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_log_service_records_activity(): void
    {
        $actor = User::factory()->create([
            'name' => 'Pemilik Toko',
            'role' => 'vendor_owner',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $actor->id,
            'shop_name' => 'Toko Audit',
        ]);

        $log = app(ActivityLogService::class)->record(
            action: 'debug.activity',
            actor: $actor,
            subject: $vendor,
            vendor: $vendor,
            description: 'Aktivitas pengujian audit log.',
            properties: [
                'status_before' => 'pending',
                'status_after' => 'completed',
            ],
        );

        $this->assertSame(
            $actor->id,
            $log->actor_id,
        );

        $this->assertSame(
            $vendor->id,
            $log->vendor_id,
        );

        $this->assertSame(
            'debug.activity',
            $log->action,
        );

        $this->assertSame(
            Vendor::class,
            $log->subject_type,
        );

        $this->assertSame(
            $vendor->id,
            $log->subject_id,
        );

        $this->assertSame(
            'pending',
            $log->properties['status_before'],
        );

        $this->assertSame(
            'completed',
            $log->properties['status_after'],
        );

        $this->assertDatabaseHas(
            'activity_logs',
            [
                'id' => $log->id,
                'actor_id' => $actor->id,
                'vendor_id' => $vendor->id,
                'action' => 'debug.activity',
                'subject_type' => Vendor::class,
                'subject_id' => $vendor->id,
            ],
        );
    }

    public function test_super_admin_can_view_activity_log_page(): void
    {
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        ActivityLog::forceCreate([
            'actor_id' => $admin->id,
            'vendor_id' => null,
            'action' => 'debug.admin',
            'subject_type' => null,
            'subject_id' => null,
            'description' => 'Aktivitas admin.',
            'properties' => [
                'source' => 'test',
            ],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get(
                route(
                    'admin.activity-logs.index',
                ),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Admin/ActivityLogs/Index',
                    )
                    ->has('logs.data', 1)
                    ->where(
                        'logs.data.0.action',
                        'debug.admin',
                    )
                    ->where(
                        'logs.data.0.actor.name',
                        'Super Admin',
                    )
                    ->has('actions', 1),
            );
    }

    public function test_non_admin_cannot_view_activity_log_page(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->actingAs($customer)
            ->get(
                route(
                    'admin.activity-logs.index',
                ),
            );

        $response->assertForbidden();
    }

    public function test_activity_log_cannot_be_updated(): void
    {
        $log = ActivityLog::forceCreate([
            'actor_id' => null,
            'vendor_id' => null,
            'action' => 'debug.original',
            'subject_type' => null,
            'subject_id' => null,
            'description' => 'Data asli.',
            'properties' => null,
            'ip_address' => null,
            'user_agent' => null,
        ]);

        $this->expectException(
            LogicException::class,
        );

        $this->expectExceptionMessage(
            'Activity log tidak boleh diubah.',
        );

        $log->update([
            'description' =>
            'Mencoba mengubah data.',
        ]);
    }

    public function test_activity_log_cannot_be_deleted(): void
    {
        $log = ActivityLog::forceCreate([
            'actor_id' => null,
            'vendor_id' => null,
            'action' => 'debug.delete',
            'subject_type' => null,
            'subject_id' => null,
            'description' => 'Data tidak boleh dihapus.',
            'properties' => null,
            'ip_address' => null,
            'user_agent' => null,
        ]);

        $this->expectException(
            LogicException::class,
        );

        $this->expectExceptionMessage(
            'Activity log tidak boleh dihapus.',
        );

        $log->delete();
    }
}
