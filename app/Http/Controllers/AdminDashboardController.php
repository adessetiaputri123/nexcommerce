<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\Vendor;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        /*
         * Memakai policy ActivityLog karena aksesnya
         * hanya diberikan kepada admin dan super admin.
         */
        Gate::authorize(
            'viewAny',
            ActivityLog::class,
        );

        $stats = [
            'total_orders' =>
            Order::query()->count(),

            'paid_orders' =>
            Order::query()
                ->where(
                    'payment_status',
                    'paid',
                )
                ->count(),

            'unpaid_orders' =>
            Order::query()
                ->where(
                    'payment_status',
                    'unpaid',
                )
                ->count(),

            'expired_orders' =>
            Order::query()
                ->where(
                    'payment_status',
                    'expired',
                )
                ->count(),

            'total_revenue' =>
            (string) Order::query()
                ->where(
                    'payment_status',
                    'paid',
                )
                ->sum('grand_total'),

            'total_vendors' =>
            Vendor::query()->count(),

            'total_vendor_balance' =>
            (string) Wallet::query()
                ->sum('balance'),

            'pending_withdrawals' =>
            WithdrawalRequest::query()
                ->where(
                    'status',
                    'pending',
                )
                ->count(),

            'pending_withdrawal_amount' =>
            (string) WithdrawalRequest::query()
                ->where(
                    'status',
                    'pending',
                )
                ->sum('amount'),
        ];

        $recentActivities = ActivityLog::query()
            ->with([
                'actor:id,name,email,role',
                'vendor:id,shop_name',
            ])
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(
                function (
                    ActivityLog $log,
                ): array {
                    return [
                        'id' => $log->id,

                        'action' =>
                        $log->action,

                        'description' =>
                        $log->description,

                        'subject_type' =>
                        $log->subject_type
                            ? class_basename(
                                $log->subject_type,
                            )
                            : null,

                        'subject_id' =>
                        $log->subject_id,

                        'created_at' =>
                        $log->created_at
                            ?->toIso8601String(),

                        'actor' =>
                        $log->actor
                            ? [
                                'id' =>
                                $log->actor->id,

                                'name' =>
                                $log->actor->name,

                                'email' =>
                                $log->actor->email,

                                'role' =>
                                $log->actor->role,
                            ]
                            : null,

                        'vendor' =>
                        $log->vendor
                            ? [
                                'id' =>
                                $log->vendor->id,

                                'shop_name' =>
                                $log
                                    ->vendor
                                    ->shop_name,
                            ]
                            : null,
                    ];
                },
            )
            ->values();

        $recentWithdrawals =
            WithdrawalRequest::query()
            ->with([
                'wallet.vendor:id,shop_name',
                'requester:id,name,email',
            ])
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(
                function (
                    WithdrawalRequest $withdrawal,
                ): array {
                    return [
                        'id' =>
                        $withdrawal->id,

                        'request_code' =>
                        $withdrawal
                            ->request_code,

                        'amount' =>
                        $withdrawal->amount,

                        'status' =>
                        $withdrawal->status,

                        'bank_name' =>
                        $withdrawal->bank_name,

                        'created_at' =>
                        $withdrawal
                            ->created_at
                            ?->toIso8601String(),

                        'vendor' => [
                            'id' =>
                            $withdrawal
                                ->wallet
                                ->vendor
                                ->id,

                            'shop_name' =>
                            $withdrawal
                                ->wallet
                                ->vendor
                                ->shop_name,
                        ],

                        'requester' => [
                            'id' =>
                            $withdrawal
                                ->requester
                                ->id,

                            'name' =>
                            $withdrawal
                                ->requester
                                ->name,

                            'email' =>
                            $withdrawal
                                ->requester
                                ->email,
                        ],
                    ];
                },
            )
            ->values();

        return Inertia::render(
            'Admin/Dashboard',
            [
                'stats' => $stats,

                'recentActivities' =>
                $recentActivities,

                'recentWithdrawals' =>
                $recentWithdrawals,
            ],
        );
    }
}
