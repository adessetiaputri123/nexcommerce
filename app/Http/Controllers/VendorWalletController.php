<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class VendorWalletController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize(
            'viewAny',
            Wallet::class,
        );

        $vendorIds = $this->accessibleVendorIds(
            $request->user(),
        );

        $userId = (int) $request->user()->id;

        $wallets = Vendor::query()
            ->whereIn('id', $vendorIds)
            ->with([
                'wallet.ledgerEntries' =>
                function ($query): void {
                    $query
                        ->with('vendorOrder.order')
                        ->latest('id');
                },

                'wallet.withdrawalRequests' =>
                function ($query): void {
                    $query
                        ->with('requester:id,name')
                        ->latest('id');
                },
            ])
            ->orderBy('shop_name')
            ->get()
            ->map(function (Vendor $vendor) use ($userId): array {
                $wallet = $vendor->wallet;

                $ledgerEntries = $wallet
                    ? $wallet->ledgerEntries
                    ->take(50)
                    ->map(function ($entry): array {
                        return [
                            'id' => $entry->id,

                            'entry_type' =>
                            $entry->entry_type,

                            'amount' =>
                            $entry->amount,

                            'balance_before' =>
                            $entry->balance_before,

                            'balance_after' =>
                            $entry->balance_after,

                            'description' =>
                            $entry->description,

                            'created_at' =>
                            $entry->created_at
                                ?->toIso8601String(),

                            'vendor_order_id' =>
                            $entry->vendor_order_id,

                            'order_id' =>
                            $entry
                                ->vendorOrder
                                ?->order_id,
                        ];
                    })
                    ->values()
                    : collect();

                $withdrawalRequests = $wallet
                    ? $wallet->withdrawalRequests
                    ->take(20)
                    ->map(function ($withdrawal): array {
                        return [
                            'id' =>
                            $withdrawal->id,

                            'request_code' =>
                            $withdrawal->request_code,

                            'amount' =>
                            $withdrawal->amount,

                            'status' =>
                            $withdrawal->status,

                            'bank_name' =>
                            $withdrawal->bank_name,

                            'bank_account_name' =>
                            $withdrawal
                                ->bank_account_name,

                            'bank_account_number' =>
                            $this->maskAccountNumber(
                                $withdrawal
                                    ->bank_account_number,
                            ),

                            'vendor_note' =>
                            $withdrawal->vendor_note,

                            'review_note' =>
                            $withdrawal->review_note,

                            'requested_by' =>
                            $withdrawal->requested_by,

                            'requester_name' =>
                            $withdrawal
                                ->requester
                                ?->name,

                            'created_at' =>
                            $withdrawal->created_at
                                ?->toIso8601String(),

                            'reviewed_at' =>
                            $withdrawal->reviewed_at
                                ?->toIso8601String(),

                            'paid_at' =>
                            $withdrawal->paid_at
                                ?->toIso8601String(),
                        ];
                    })
                    ->values()
                    : collect();

                return [
                    'vendor' => [
                        'id' => $vendor->id,

                        'shop_name' =>
                        $vendor->shop_name,
                    ],

                    'wallet_id' =>
                    $wallet?->id,

                    'can_withdraw' =>
                    $wallet !== null
                        && (int) $vendor->owner_id === $userId
                        && (float) $wallet->balance > 0,

                    'balance' =>
                    $wallet?->balance ?? '0.00',

                    'ledger_count' =>
                    $wallet
                        ?->ledgerEntries
                        ->count() ?? 0,

                    'ledger_entries' =>
                    $ledgerEntries,

                    'withdrawal_requests' =>
                    $withdrawalRequests,
                ];
            })
            ->values();

        $totalBalance = $wallets->sum(
            fn(array $wallet): float =>
            (float) $wallet['balance'],
        );

        return Inertia::render(
            'VendorWallet/Index',
            [
                'wallets' => $wallets,

                'totalBalance' =>
                $totalBalance,
            ],
        );
    }

    private function accessibleVendorIds(
        User $user,
    ): Collection {
        $vendorIds = Vendor::query()
            ->where('owner_id', $user->id)
            ->pluck('id')
            ->map(
                fn($id): int =>
                (int) $id,
            );

        if ($user->vendor_id !== null) {
            $vendorIds->push(
                (int) $user->vendor_id,
            );
        }

        return $vendorIds
            ->unique()
            ->values();
    }

    private function maskAccountNumber(
        string $accountNumber,
    ): string {
        $length = strlen($accountNumber);

        if ($length <= 4) {
            return $accountNumber;
        }

        return str_repeat(
            '*',
            $length - 4,
        ) . substr(
            $accountNumber,
            -4,
        );
    }
}
