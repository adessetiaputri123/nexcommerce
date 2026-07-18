<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use App\Models\VendorOrder;
use App\Models\Wallet;
use Inertia\Middleware;
use App\Models\WithdrawalRequest;
use App\Models\ActivityLog;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user?->only([
                    'id',
                    'name',
                    'email',
                    'role',
                    'vendor_id',
                ]),

                'unread_notifications_count' => fn() =>
                $request->user()
                    ?->unreadNotifications()
                    ->count() ?? 0,

                'can_view_activity_logs' => fn() =>
                $user?->can(
                    'viewAny',
                    ActivityLog::class,
                ) ?? false,

                'permissions' => fn() => $user
                    ? $user->permissions()
                    ->pluck('name')
                    ->values()
                    ->all()
                    : [],


                'can_view_vendor_orders' => fn() =>
                $user?->can(
                    'viewAny',
                    VendorOrder::class,
                ) ?? false,

                'can_view_vendor_wallet' => fn() =>
                $user?->can(
                    'viewAny',
                    Wallet::class,
                ) ?? false,
            ],

            'can_manage_withdrawals' => fn() =>
            $user?->can(
                'viewAny',
                WithdrawalRequest::class,
            ) ?? false,

            'cartSummary' => [
                'item_count' => fn() =>
                $this->cartItemCount($request),
            ],

            'flash' => [
                'message' => fn() =>
                $request->session()->get('message'),

                'error' => fn() =>
                $request->session()->get('error'),
            ],
        ];
    }

    /**
     * Menghitung total quantity seluruh item keranjang customer.
     */
    private function cartItemCount(Request $request): int
    {
        $user = $request->user();

        if (!$user || $user->role !== 'customer') {
            return 0;
        }

        $cart = $user->cart()
            ->withSum(
                'items as item_quantity_sum',
                'quantity',
            )
            ->first();

        return (int) ($cart?->item_quantity_sum ?? 0);
    }
}
