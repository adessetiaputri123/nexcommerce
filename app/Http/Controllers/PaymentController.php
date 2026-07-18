<?php

namespace App\Http\Controllers;

use App\Http\Requests\PayOrderRequest;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class PaymentController extends Controller
{
    public function store(
        PayOrderRequest $request,
        Order $order,
        PaymentService $paymentService,
    ): RedirectResponse {
        try {
            $paidOrder = $paymentService->pay(
                order: $order,
                actor: $request->user(),
            );

            return redirect()
                ->route(
                    'orders.show',
                    $paidOrder,
                )
                ->with(
                    'message',
                    "Pembayaran pesanan #{$paidOrder->id} berhasil.",
                );
        } catch (
            ValidationException |
            AuthorizationException $exception
        ) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error(
                'Gagal memproses pembayaran.',
                [
                    'order_id' => $order->id,
                    'customer_id' =>
                    $request->user()?->id,
                    'exception' =>
                    $exception::class,
                    'message' =>
                    $exception->getMessage(),
                ],
            );

            return back()->withErrors([
                'payment' =>
                'Pembayaran gagal diproses. Silakan coba kembali.',
            ]);
        }
    }
}
