<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_notification_page(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(
            new SystemNotification(
                title: 'Notifikasi Pengujian',
                message: 'Isi notifikasi pengujian.',
                url: '/dashboard',
                level: 'success',
                meta: [
                    'source' => 'feature-test',
                ],
            ),
        );

        $response = $this
            ->actingAs($user)
            ->get(
                route('notifications.index'),
            );

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component(
                        'Notifications/Index',
                    )
                    ->has(
                        'notifications.data',
                        1,
                    )
                    ->where(
                        'notifications.data.0.title',
                        'Notifikasi Pengujian',
                    )
                    ->where(
                        'notifications.data.0.message',
                        'Isi notifikasi pengujian.',
                    )
                    ->where(
                        'notifications.data.0.url',
                        '/dashboard',
                    )
                    ->where(
                        'notifications.data.0.level',
                        'success',
                    )
                    ->where(
                        'notifications.data.0.is_read',
                        false,
                    )
                    ->where(
                        'unreadCount',
                        1,
                    ),
            );
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(
            new SystemNotification(
                title: 'Belum Dibaca',
                message: 'Notifikasi belum dibaca.',
            ),
        );

        $notification = $user
            ->notifications()
            ->firstOrFail();

        $response = $this
            ->actingAs($user)
            ->from(
                route('notifications.index'),
            )
            ->post(
                route(
                    'notifications.read',
                    $notification->id,
                ),
            );

        $response
            ->assertRedirect(
                route('notifications.index'),
            )
            ->assertSessionHas(
                'message',
                'Notifikasi ditandai sudah dibaca.',
            );

        $this->assertNotNull(
            $notification
                ->fresh()
                ->read_at,
        );
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $firstUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $secondUser->notify(
            new SystemNotification(
                title: 'Milik Pengguna Lain',
                message: 'Notifikasi ini bukan milik pengguna pertama.',
            ),
        );

        $notification = $secondUser
            ->notifications()
            ->firstOrFail();

        $response = $this
            ->actingAs($firstUser)
            ->post(
                route(
                    'notifications.read',
                    $notification->id,
                ),
            );

        $response->assertNotFound();

        $this->assertNull(
            $notification
                ->fresh()
                ->read_at,
        );
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $otherUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $user->notify(
            new SystemNotification(
                title: 'Notifikasi Pertama',
                message: 'Notifikasi pertama.',
            ),
        );

        $user->notify(
            new SystemNotification(
                title: 'Notifikasi Kedua',
                message: 'Notifikasi kedua.',
            ),
        );

        $otherUser->notify(
            new SystemNotification(
                title: 'Notifikasi Pengguna Lain',
                message: 'Tidak boleh ikut ditandai.',
            ),
        );

        $this->assertSame(
            2,
            $user
                ->unreadNotifications()
                ->count(),
        );

        $response = $this
            ->actingAs($user)
            ->from(
                route('notifications.index'),
            )
            ->post(
                route('notifications.read-all'),
            );

        $response
            ->assertRedirect(
                route('notifications.index'),
            )
            ->assertSessionHas(
                'message',
                'Semua notifikasi ditandai sudah dibaca.',
            );

        $this->assertSame(
            0,
            $user
                ->fresh()
                ->unreadNotifications()
                ->count(),
        );

        $this->assertSame(
            1,
            $otherUser
                ->fresh()
                ->unreadNotifications()
                ->count(),
        );
    }

    public function test_guest_cannot_view_notification_page(): void
    {
        $response = $this->get(
            route('notifications.index'),
        );

        $response->assertRedirect(
            route('login'),
        );
    }
}
