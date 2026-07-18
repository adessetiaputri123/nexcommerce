<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductSku;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class CartItemController extends Controller
{
    public function store(
        StoreCartItemRequest $request,
    ) {
        $validated = $request->validated();
        $customer = $request->user();

        try {
            DB::transaction(function () use (
                $validated,
                $customer,
            ): void {
                $sku = ProductSku::query()
                    ->with('product')
                    ->lockForUpdate()
                    ->findOrFail(
                        $validated['product_sku_id'],
                    );

                if (!$sku->product) {
                    throw ValidationException::withMessages([
                        'product_sku_id' =>
                        'Produk sudah tidak tersedia.',
                    ]);
                }

                $cart = Cart::firstOrCreate([
                    'customer_id' => $customer->id,
                ]);

                $cartItem = $cart->items()
                    ->where(
                        'product_sku_id',
                        $sku->id,
                    )
                    ->lockForUpdate()
                    ->first();

                $currentQuantity =
                    $cartItem?->quantity ?? 0;

                $newQuantity =
                    $currentQuantity
                    + $validated['quantity'];

                if ($newQuantity > $sku->stock) {
                    throw ValidationException::withMessages([
                        'quantity' =>
                        "Jumlah melebihi stok. "
                            . "Stok tersedia: {$sku->stock}.",
                    ]);
                }

                if ($cartItem) {
                    $cartItem->update([
                        'quantity' => $newQuantity,
                    ]);

                    return;
                }

                $cart->items()->create([
                    'product_sku_id' => $sku->id,
                    'quantity' =>
                    $validated['quantity'],
                    'price_snapshot' => $sku->price,
                ]);
            });

            return back()->with(
                'message',
                'Produk berhasil ditambahkan ke keranjang.',
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error(
                'Gagal menambahkan produk ke keranjang',
                [
                    'customer_id' => $customer->id,
                    'product_sku_id' =>
                    $validated['product_sku_id'],
                    'message' => $e->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Produk gagal ditambahkan ke keranjang.',
            ]);
        }
    }

    public function update(
        UpdateCartItemRequest $request,
        CartItem $cartItem,
    ) {
        $validated = $request->validated();

        try {
            DB::transaction(function () use (
                $validated,
                $cartItem,
            ): void {
                $lockedItem = CartItem::query()
                    ->whereKey($cartItem->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $sku = ProductSku::query()
                    ->with('product')
                    ->whereKey(
                        $lockedItem->product_sku_id,
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$sku->product) {
                    throw ValidationException::withMessages([
                        'quantity' =>
                        'Produk sudah tidak tersedia.',
                    ]);
                }

                if (
                    $validated['quantity']
                    > $sku->stock
                ) {
                    throw ValidationException::withMessages([
                        'quantity' =>
                        "Stok hanya tersedia {$sku->stock}.",
                    ]);
                }

                $lockedItem->update([
                    'quantity' =>
                    $validated['quantity'],
                ]);
            });

            return back()->with(
                'message',
                'Jumlah produk berhasil diperbarui.',
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error(
                'Gagal memperbarui item keranjang',
                [
                    'cart_item_id' => $cartItem->id,
                    'message' => $e->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Jumlah produk gagal diperbarui.',
            ]);
        }
    }

    public function destroy(CartItem $cartItem)
    {
        Gate::authorize('delete', $cartItem);

        try {
            $cartItem->delete();

            return back()->with(
                'message',
                'Produk berhasil dihapus dari keranjang.',
            );
        } catch (Throwable $e) {
            Log::error(
                'Gagal menghapus item keranjang',
                [
                    'cart_item_id' => $cartItem->id,
                    'message' => $e->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Produk gagal dihapus dari keranjang.',
            ]);
        }
    }
}
