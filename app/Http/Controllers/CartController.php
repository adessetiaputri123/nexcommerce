<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Services\CartValidationService;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $customer = $request->user();
        Gate::authorize('create', Cart::class);
        $cart = Cart::firstOrCreate([
            'customer_id' => $customer->id,
        ]);

        Gate::authorize('view', $cart);

        $cart->load([
            'items.productSku.product.vendor',
        ]);

        $items = $cart->items
            ->map(function ($item): array {
                $sku = $item->productSku;
                $product = $sku?->product;
                $vendor = $product?->vendor;

                $subtotal = (float) $item->price_snapshot
                    * $item->quantity;

                return [
                    'id' => $item->id,

                    'quantity' => $item->quantity,

                    'price_snapshot' =>
                    $item->price_snapshot,

                    'subtotal' => $subtotal,

                    'available' =>
                    $sku !== null
                        && $product !== null
                        && $sku->stock > 0,

                    'sku' => $sku ? [
                        'id' => $sku->id,
                        'code' => $sku->sku,
                        'stock' => $sku->stock,
                        'current_price' => $sku->price,
                    ] : null,

                    'product' => $product ? [
                        'id' => $product->id,
                        'name' => $product->name,
                        'description' =>
                        $product->description,
                    ] : null,

                    'vendor' => $vendor ? [
                        'id' => $vendor->id,
                        'shop_name' =>
                        $vendor->shop_name,
                    ] : null,
                ];
            })
            ->values();

        return Inertia::render('Cart/Index', [
            'cart' => [
                'id' => $cart->id,

                'items' => $items,

                'item_count' =>
                $items->sum('quantity'),

                'subtotal' =>
                $items->sum('subtotal'),
            ],
        ]);
    }

    public function validateForCheckout(
        Request $request,
        CartValidationService $cartValidationService,
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

        $summary =
            $cartValidationService
            ->validateForCheckout($cart);

        return back()->with(
            'message',
            "Keranjang siap diproses. "
                . "Total {$summary['item_count']} barang.",
        );
    }
}
