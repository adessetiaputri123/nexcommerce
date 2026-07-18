<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        $notifications = $request
            ->user()
            ->notifications()
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(
                function ($notification): array {
                    return [
                        'id' =>
                        $notification->id,

                        'title' =>
                        $notification->data['title']
                            ?? 'Notifikasi',

                        'message' =>
                        $notification->data['message']
                            ?? '',

                        'url' =>
                        $notification->data['url']
                            ?? null,

                        'level' =>
                        $notification->data['level']
                            ?? 'info',

                        'meta' =>
                        $notification->data['meta']
                            ?? [],

                        'is_read' =>
                        $notification->read_at
                            !== null,

                        'read_at' =>
                        $notification
                            ->read_at
                            ?->toIso8601String(),

                        'created_at' =>
                        $notification
                            ->created_at
                            ?->toIso8601String(),
                    ];
                },
            );

        return Inertia::render(
            'Notifications/Index',
            [
                'notifications' =>
                $notifications,

                'unreadCount' =>
                $request
                    ->user()
                    ->unreadNotifications()
                    ->count(),
            ],
        );
    }

    public function markAsRead(
        Request $request,
        string $notification,
    ): RedirectResponse {
        $databaseNotification = $request
            ->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        if ($databaseNotification->read_at === null) {
            $databaseNotification->markAsRead();
        }

        return back()->with(
            'message',
            'Notifikasi ditandai sudah dibaca.',
        );
    }

    public function markAllAsRead(
        Request $request,
    ): RedirectResponse {
        $request
            ->user()
            ->unreadNotifications
            ->markAsRead();

        return back()->with(
            'message',
            'Semua notifikasi ditandai sudah dibaca.',
        );
    }
}
