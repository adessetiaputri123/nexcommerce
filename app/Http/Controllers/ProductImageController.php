<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class ProductImageController extends Controller
{
    public function setPrimary(
        Product $product,
        ProductImage $image,
        ProductImageService $productImageService,
    ): RedirectResponse {
        Gate::authorize(
            'update',
            $product,
        );

        abort_unless(
            (int) $image->product_id
                === (int) $product->id,
            404,
        );

        $productImageService->setPrimary(
            product: $product,
            image: $image,
        );

        return back()->with(
            'message',
            'Foto utama produk berhasil diperbarui.',
        );
    }

    public function destroy(
        Product $product,
        ProductImage $image,
        ProductImageService $productImageService,
    ): RedirectResponse {
        Gate::authorize(
            'update',
            $product,
        );

        abort_unless(
            (int) $image->product_id
                === (int) $product->id,
            404,
        );

        $productImageService->delete(
            $image,
        );

        return back()->with(
            'message',
            'Foto produk berhasil dihapus.',
        );
    }
}
