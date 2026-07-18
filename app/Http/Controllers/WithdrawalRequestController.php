<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitWithdrawalRequest;
use App\Models\Wallet;
use App\Services\WithdrawalService;
use Illuminate\Http\RedirectResponse;

class WithdrawalRequestController extends Controller
{
    public function store(
        SubmitWithdrawalRequest $request,
        Wallet $wallet,
        WithdrawalService $withdrawalService,
    ): RedirectResponse {
        $withdrawal = $withdrawalService->createRequest(
            wallet: $wallet,
            requester: $request->user(),
            data: $request->validated(),
        );

        return back()->with(
            'message',
            "Penarikan {$withdrawal->request_code} berhasil diajukan.",
        );
    }
}
