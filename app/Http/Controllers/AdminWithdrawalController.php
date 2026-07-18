<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewWithdrawalRequest;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminWithdrawalController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize(
            'viewAny',
            WithdrawalRequest::class,
        );

        $status = $request->string('status')->toString();

        $withdrawals = WithdrawalRequest::query()
            ->with([
                'wallet.vendor:id,shop_name',
                'requester:id,name,email',
                'reviewer:id,name',
            ])
            ->when(
                in_array(
                    $status,
                    [
                        'pending',
                        'approved',
                        'rejected',
                        'paid',
                    ],
                    true,
                ),
                fn($query) =>
                $query->where('status', $status),
            )
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(function (
                WithdrawalRequest $withdrawal,
            ): array {
                return [
                    'id' => $withdrawal->id,

                    'request_code' =>
                    $withdrawal->request_code,

                    'amount' =>
                    $withdrawal->amount,

                    'status' =>
                    $withdrawal->status,

                    'bank_name' =>
                    $withdrawal->bank_name,

                    'bank_account_name' =>
                    $withdrawal->bank_account_name,

                    'bank_account_number' =>
                    $withdrawal->bank_account_number,

                    'vendor_note' =>
                    $withdrawal->vendor_note,

                    'review_note' =>
                    $withdrawal->review_note,

                    'created_at' =>
                    $withdrawal->created_at
                        ?->toIso8601String(),

                    'reviewed_at' =>
                    $withdrawal->reviewed_at
                        ?->toIso8601String(),

                    'paid_at' =>
                    $withdrawal->paid_at
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
                        $withdrawal->requester->id,

                        'name' =>
                        $withdrawal->requester->name,

                        'email' =>
                        $withdrawal->requester->email,
                    ],

                    'reviewer_name' =>
                    $withdrawal
                        ->reviewer
                        ?->name,
                ];
            });

        return Inertia::render(
            'Admin/Withdrawals/Index',
            [
                'withdrawals' => $withdrawals,

                'filters' => [
                    'status' => $status,
                ],
            ],
        );
    }

    public function update(
        ReviewWithdrawalRequest $request,
        WithdrawalRequest $withdrawal,
        WithdrawalReviewService $service,
    ): RedirectResponse {
        Gate::authorize(
            'update',
            $withdrawal,
        );

        $validated = $request->validated();

        match ($validated['action']) {
            'approve' => $service->approve(
                withdrawal: $withdrawal,
                reviewer: $request->user(),
                reviewNote: $validated['review_note'] ?? null,
            ),

            'reject' => $service->reject(
                withdrawal: $withdrawal,
                reviewer: $request->user(),
                reviewNote: $validated['review_note'],
            ),

            'paid' => $service->markAsPaid(
                withdrawal: $withdrawal,
                reviewer: $request->user(),
            ),
        };

        $message = match ($validated['action']) {
            'approve' =>
            'Penarikan berhasil disetujui.',

            'reject' =>
            'Penarikan berhasil ditolak dan saldo dikembalikan.',

            'paid' =>
            'Penarikan berhasil ditandai sudah dibayar.',
        };

        return back()->with(
            'message',
            $message,
        );
    }
}
