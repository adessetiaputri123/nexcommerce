<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Models\Wallet;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class VendorDashboardController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            VendorOrder::class,
        );

        $user = $request->user();

        $vendor = Vendor::query()
            ->where(
                function ($query) use ($user): void {
                    if ($user->vendor_id) {
                        $query->where(
                            'id',
                            $user->vendor_id,
                        );
                    }

                    $query->orWhere(
                        'owner_id',
                        $user->id,
                    );
                },
            )
            ->firstOrFail();

        $wallet = Wallet::query()
            ->where(
                'vendor_id',
                $vendor->id,
            )
            ->first();

        $baseOrderQuery =
            VendorOrder::query()
            ->where(
                'vendor_id',
                $vendor->id,
            );

        $stats = [
            'total_orders' => (clone $baseOrderQuery)
                ->count(),

            'paid_orders' => (clone $baseOrderQuery)
                ->whereHas(
                    'order',
                    fn($query) =>
                    $query->where(
                        'payment_status',
                        'paid',
                    ),
                )
                ->count(),

            'completed_orders' => (clone $baseOrderQuery)
                ->where(
                    'status',
                    'completed',
                )
                ->count(),

            'processing_orders' => (clone $baseOrderQuery)
                ->whereIn(
                    'status',
                    [
                        'confirmed',
                        'processing',
                        'packed',
                        'shipped',
                    ],
                )
                ->count(),

            'gross_sales' =>
            (string) (
                clone $baseOrderQuery
            )
                ->whereHas(
                    'order',
                    fn($query) =>
                    $query->where(
                        'payment_status',
                        'paid',
                    ),
                )
                ->sum('subtotal'),

            'completed_sales' =>
            (string) (
                clone $baseOrderQuery
            )
                ->where(
                    'status',
                    'completed',
                )
                ->sum('subtotal'),

            'wallet_balance' =>
            (string) (
                $wallet?->balance ?? 0
            ),

            'pending_withdrawals' =>
            $wallet
                ? WithdrawalRequest::query()
                ->where(
                    'wallet_id',
                    $wallet->id,
                )
                ->where(
                    'status',
                    'pending',
                )
                ->count()
                : 0,

            'pending_withdrawal_amount' =>
            (string) (
                $wallet
                ? WithdrawalRequest::query()
                ->where(
                    'wallet_id',
                    $wallet->id,
                )
                ->where(
                    'status',
                    'pending',
                )
                ->sum('amount')
                : 0
            ),
        ];

        $recentOrders =
            VendorOrder::query()
            ->with([
                'order:id,payment_status,payment_reference,created_at',
            ])
            ->where(
                'vendor_id',
                $vendor->id,
            )
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(
                function (
                    VendorOrder $vendorOrder,
                ): array {
                    return [
                        'id' =>
                        $vendorOrder->id,

                        'order_id' =>
                        $vendorOrder->order_id,

                        'status' =>
                        $vendorOrder->status,

                        'subtotal' =>
                        (string) (
                            $vendorOrder
                            ->subtotal
                        ),

                        'payment_status' =>
                        $vendorOrder
                            ->order
                            ->payment_status,

                        'payment_reference' =>
                        $vendorOrder
                            ->order
                            ->payment_reference,

                        'created_at' =>
                        $vendorOrder
                            ->created_at
                            ?->toIso8601String(),
                    ];
                },
            )
            ->values();

        $recentWithdrawals =
            $wallet
            ? WithdrawalRequest::query()
            ->where(
                'wallet_id',
                $wallet->id,
            )
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
                        (string) (
                            $withdrawal
                            ->amount
                        ),

                        'status' =>
                        $withdrawal
                            ->status,

                        'bank_name' =>
                        $withdrawal
                            ->bank_name,

                        'created_at' =>
                        $withdrawal
                            ->created_at
                            ?->toIso8601String(),
                    ];
                },
            )
            ->values()
            : collect();

        return Inertia::render(
            'Vendor/Dashboard',
            [
                'vendor' => [
                    'id' =>
                    $vendor->id,

                    'shop_name' =>
                    $vendor->shop_name,
                ],

                'stats' =>
                $stats,

                'recentOrders' =>
                $recentOrders,

                'recentWithdrawals' =>
                $recentWithdrawals,
            ],
        );
    }
}
