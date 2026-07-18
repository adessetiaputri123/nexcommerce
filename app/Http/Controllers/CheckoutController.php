<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Services\CartValidationService;
use App\Services\CheckoutPreviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\PlaceOrderRequest;
use App\Services\CheckoutService;
use Illuminate\Support\Facades\Log;
use Throwable;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function show(
        Request $request,
        CartValidationService $cartValidationService,
        CheckoutPreviewService $checkoutPreviewService,
    ) {
        Gate::authorize('create', Cart::class);

        $cart = $request->user()
            ->cart()
            ->first();

        if (!$cart) {
            throw ValidationException::withMessages([
                'cart' => 'Keranjang masih kosong.',
            ]);
        }

        Gate::authorize('view', $cart);

        /*
         * Memastikan produk dan stok masih valid.
         */
        $cartValidationService
            ->validateForCheckout($cart);

        /*
         * Menyusun preview checkout per vendor.
         */
        $checkout = $checkoutPreviewService
            ->build($cart);

        return Inertia::render(
            'Checkout/Show',
            [
                'checkout' => $checkout,
            ],
        );
    }

    public function store(
        PlaceOrderRequest $request,
        CheckoutService $checkoutService,
    ) {
        try {
            $order = $checkoutService->place(
                $request->user(),
            );

            return redirect()
                ->route('orders.show', $order)
                ->with(
                    'message',
                    "Pesanan #{$order->id} berhasil dibuat.",
                );
        } catch (
            \Illuminate\Validation\ValidationException $e
        ) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('Gagal membuat pesanan', [
                'customer_id' => $request->user()->id,
                'message' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' =>
                'Pesanan gagal dibuat. Silakan coba kembali.',
            ]);
        }
    }
}
