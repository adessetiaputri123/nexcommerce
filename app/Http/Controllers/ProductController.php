<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductCatalogPricingService;
use App\Services\ProductImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProductController extends Controller
{
    // =========================================================
    // WEB INERTIA
    // =========================================================

    public function indexWeb(
        ProductCatalogPricingService $catalogPricingService,
    ): Response {
        $products = Product::query()
            ->with([
                'skus',
                'primaryImage',
                'vendor:id,shop_name',
            ])
            ->latest()
            ->get()
            ->map(
                function (
                    Product $product,
                ) use (
                    $catalogPricingService,
                ): array {
                    $pricing =
                        $catalogPricingService
                        ->forProduct(
                            $product,
                        );

                    return [
                        /*
                         * Pertahankan seluruh atribut dan
                         * relasi lama agar Index.jsx yang
                         * sudah ada tidak rusak.
                         */
                        ...$product->toArray(),

                        /*
                         * Informasi rentang harga normal,
                         * harga akhir, diskon, dan promo.
                         */
                        'pricing' =>
                        $pricing,

                        /*
                         * Field price tetap disediakan
                         * untuk kompatibilitas frontend lama.
                         */
                        'skus' =>
                        collect(
                            $pricing['skus'],
                        )
                            ->map(
                                fn(
                                    array $sku,
                                ): array =>
                                $this
                                    ->catalogSkuPayload(
                                        $sku,
                                    ),
                            )
                            ->values()
                            ->all(),
                    ];
                },
            )
            ->values();

        return Inertia::render(
            'Products/Index',
            [
                'products' =>
                $products,
            ],
        );
    }

    public function showWeb(
        Product $product,
        ProductCatalogPricingService $catalogPricingService,
    ): Response {
        $product->load([
            'vendor:id,shop_name',
            'skus',
            'images',
        ]);

        $pricing =
            $catalogPricingService
            ->forProduct(
                $product,
            );

        $skuItems =
            collect(
                $pricing['skus'],
            )
            ->map(
                fn(
                    array $sku,
                ): array =>
                $this
                    ->catalogSkuPayload(
                        $sku,
                    ),
            )
            ->values();

        $totalStock =
            $skuItems->sum(
                fn(
                    array $sku,
                ): int =>
                (int) $sku['stock'],
            );

        return Inertia::render(
            'Products/Show',
            [
                'product' => [
                    'id' =>
                    $product->id,

                    'name' =>
                    $product->name,

                    'description' =>
                    $product->description,

                    'vendor' =>
                    $product->vendor
                        ? [
                            'id' =>
                            $product
                                ->vendor
                                ->id,

                            'shop_name' =>
                            $product
                                ->vendor
                                ->shop_name,
                        ]
                        : null,

                    /*
                     * Field lama tetap dipertahankan
                     * agar Show.jsx tidak langsung rusak.
                     */
                    'minimum_price' =>
                    $pricing['lowest_original_price'] ?? '0.00',

                    'maximum_price' =>
                    $pricing['highest_original_price'] ?? '0.00',

                    'minimum_final_price' =>
                    $pricing['lowest_final_price'] ?? '0.00',

                    'maximum_final_price' =>
                    $pricing['highest_final_price'] ?? '0.00',

                    'total_stock' =>
                    $totalStock,

                    'images' =>
                    $product
                        ->images
                        ->map(
                            fn(
                                $image,
                            ): array => [
                                'id' =>
                                $image->id,

                                'image_url' =>
                                $image
                                    ->image_url,

                                'alt_text' =>
                                $image
                                    ->alt_text
                                    ?? $product
                                    ->name,

                                'is_primary' =>
                                (bool) $image
                                    ->is_primary,

                                'sort_order' =>
                                (int) $image
                                    ->sort_order,
                            ],
                        )
                        ->values()
                        ->all(),

                    /*
                     * Data harga promo tingkat produk.
                     */
                    'pricing' =>
                    $pricing,

                    /*
                     * Setiap SKU kini membawa harga normal,
                     * harga promo, potongan, dan detail promo.
                     */
                    'skus' =>
                    $skuItems->all(),
                ],
            ],
        );
    }


    public function manageWeb(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            Product::class,
        );

        $vendor = $request
            ->user()
            ->managedVendor();

        if (!$vendor) {
            abort(
                403,
                'User tidak terhubung dengan vendor.',
            );
        }

        $products = Product::query()
            ->with([
                'skus',
                'primaryImage',
            ])
            ->where(
                'vendor_id',
                $vendor->id,
            )
            ->latest()
            ->get();

        return Inertia::render(
            'Products/Manage',
            [
                'products' => $products,

                'vendor' => [
                    'id' =>
                    $vendor->id,

                    'shop_name' =>
                    $vendor->shop_name,
                ],
            ],
        );
    }

    public function manage(): Response
    {
        return Inertia::render(
            'Products/Manage',
        );
    }

    public function create(): Response
    {
        Gate::authorize(
            'create',
            Product::class,
        );

        return Inertia::render(
            'Products/Create',
        );
    }

    public function edit(
        Product $product,
    ): Response {
        Gate::authorize(
            'update',
            $product,
        );

        /*
         * Relasi images sudah diurutkan melalui
         * relasi images() pada model Product.
         */
        $product->load([
            'skus',
            'images',
        ]);

        return Inertia::render(
            'Products/Edit',
            [
                'product' =>
                $product,
            ],
        );
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        ProductImageService $productImageService,
    ): RedirectResponse {
        Gate::authorize(
            'update',
            $product,
        );

        $validated = $request->validated();

        /*
         * Pisahkan file gambar agar tidak ikut
         * dimasukkan ke tabel products.
         */
        $images = $request->file(
            'images',
            [],
        );

        $images = is_array($images)
            ? $images
            : [];

        unset(
            $validated['images'],
        );

        try {
            DB::transaction(
                function () use (
                    $validated,
                    $product,
                    $images,
                    $productImageService,
                ): void {
                    /*
                     * Perbarui informasi utama produk.
                     */
                    $product->update([
                        'name' =>
                        $validated['name'],

                        'description' =>
                        $validated['description']
                            ?? null,
                    ]);

                    /*
                     * Ambil ID SKU lama yang masih
                     * dikirim oleh formulir.
                     */
                    $submittedSkuIds = collect(
                        $validated['skus'],
                    )
                        ->pluck('id')
                        ->filter()
                        ->map(
                            fn($id): int =>
                            (int) $id,
                        )
                        ->values()
                        ->all();

                    /*
                     * SKU lama yang tidak lagi dikirim
                     * dianggap dihapus dari formulir.
                     */
                    $skusToDeleteQuery =
                        $product->skus();

                    if ($submittedSkuIds !== []) {
                        $skusToDeleteQuery
                            ->whereNotIn(
                                'id',
                                $submittedSkuIds,
                            );
                    }

                    $skusToDelete =
                        $skusToDeleteQuery->get();

                    foreach (
                        $skusToDelete
                        as $skuToDelete
                    ) {
                        /*
                         * SKU yang pernah dipakai dalam
                         * transaksi tidak boleh dihapus.
                         */
                        $hasOrderItems =
                            Schema::hasTable(
                                'order_items',
                            )
                            && DB::table(
                                'order_items',
                            )
                            ->where(
                                'product_sku_id',
                                $skuToDelete->id,
                            )
                            ->exists();

                        if ($hasOrderItems) {
                            throw ValidationException::withMessages([
                                'skus' =>
                                "SKU {$skuToDelete->sku} sudah digunakan "
                                    . 'dalam transaksi dan tidak dapat dihapus.',
                            ]);
                        }

                        $skuToDelete->delete();
                    }

                    /*
                     * Perbarui SKU lama atau buat
                     * varian SKU baru.
                     */
                    foreach (
                        $validated['skus']
                        as $skuData
                    ) {
                        $payload = [
                            'sku' =>
                            $skuData['sku'],

                            'price' =>
                            $skuData['price'],

                            'stock' =>
                            $skuData['stock'],
                        ];

                        if (!empty($skuData['id'])) {
                            $sku = $product
                                ->skus()
                                ->whereKey(
                                    $skuData['id'],
                                )
                                ->firstOrFail();

                            $sku->update(
                                $payload,
                            );

                            continue;
                        }

                        $product
                            ->skus()
                            ->create(
                                $payload,
                            );
                    }

                    /*
                     * Simpan foto tambahan setelah
                     * produk dan SKU berhasil diproses.
                     */
                    $productImageService->storeMany(
                        product: $product,

                        images: $images,
                    );
                },
                attempts: 5,
            );

            return redirect()
                ->route(
                    'vendor.products.index',
                )
                ->with(
                    'message',
                    'Produk, varian SKU, dan foto berhasil diperbarui.',
                );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error(
                'Gagal memperbarui produk',
                [
                    'product_id' =>
                    $product->id,

                    'user_id' =>
                    $request->user()->id,

                    'message' =>
                    $exception->getMessage(),
                ],
            );

            return back()
                ->withInput()
                ->withErrors([
                    'error' =>
                    'Produk gagal diperbarui. Silakan coba kembali.',
                ]);
        }
    }

    public function storeWeb(
        StoreProductRequest $request,
        ProductImageService $productImageService,
    ): RedirectResponse {
        Gate::authorize(
            'create',
            Product::class,
        );

        $vendor = $request
            ->user()
            ->managedVendor();

        if (!$vendor) {
            return back()->withErrors([
                'error' =>
                'Akun ini tidak memiliki vendor.',
            ]);
        }

        $validated = $request->validated();

        /*
         * Ambil file gambar secara terpisah
         * dari data utama produk.
         */
        $images = $request->file(
            'images',
            [],
        );

        $images = is_array($images)
            ? $images
            : [];

        unset(
            $validated['images'],
        );

        try {
            DB::transaction(
                function () use (
                    $validated,
                    $vendor,
                    $images,
                    $productImageService,
                ): void {
                    $product = Product::query()
                        ->create([
                            'vendor_id' =>
                            $vendor->id,

                            'name' =>
                            $validated['name'],

                            'description' =>
                            $validated['description']
                                ?? null,
                        ]);

                    $product
                        ->skus()
                        ->createMany(
                            $validated['skus'],
                        );

                    /*
                     * Foto pertama otomatis menjadi
                     * foto utama melalui service.
                     */
                    $productImageService->storeMany(
                        product: $product,

                        images: $images,
                    );
                },
                attempts: 5,
            );

            return redirect()
                ->route(
                    'vendor.products.index',
                )
                ->with(
                    'message',
                    'Produk, varian SKU, dan foto berhasil ditambahkan.',
                );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error(
                'Gagal menyimpan produk',
                [
                    'user_id' =>
                    $request->user()->id,

                    'vendor_id' =>
                    $vendor->id,

                    'message' =>
                    $exception->getMessage(),
                ],
            );

            return back()
                ->withInput()
                ->withErrors([
                    'error' =>
                    'Produk gagal disimpan. Silakan coba kembali.',
                ]);
        }
    }

    // =========================================================
    // HAPUS DAN PULIHKAN PRODUK
    // =========================================================

    public function destroy(
        Product $product,
    ): RedirectResponse {
        Gate::authorize(
            'delete',
            $product,
        );

        try {
            /*
             * Produk memakai soft delete sehingga file
             * foto tidak dihapus. Foto akan kembali
             * tersedia ketika produk dipulihkan.
             */
            $product->delete();

            return redirect()
                ->route(
                    'vendor.products.index',
                )
                ->with(
                    'message',
                    'Produk berhasil dihapus.',
                );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal menghapus produk',
                [
                    'product_id' =>
                    $product->id,

                    'message' =>
                    $exception->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Produk gagal dihapus.',
            ]);
        }
    }

    public function trash(
        Request $request,
    ): Response|RedirectResponse {
        Gate::authorize(
            'viewAny',
            Product::class,
        );

        $vendor = $request
            ->user()
            ->managedVendor();

        if (!$vendor) {
            return redirect()
                ->route('dashboard')
                ->withErrors([
                    'error' =>
                    'Akun ini tidak memiliki vendor.',
                ]);
        }

        $products = Product::onlyTrashed()
            ->with([
                'skus',
                'primaryImage',
            ])
            ->where(
                'vendor_id',
                $vendor->id,
            )
            ->latest('deleted_at')
            ->get();

        return Inertia::render(
            'Products/Trash',
            [
                'products' =>
                $products,

                'vendor' => [
                    'id' =>
                    $vendor->id,

                    'shop_name' =>
                    $vendor->shop_name,
                ],
            ],
        );
    }

    public function restore(
        Product $product,
    ): RedirectResponse {
        Gate::authorize(
            'restore',
            $product,
        );

        if (!$product->trashed()) {
            return redirect()
                ->route(
                    'vendor.products.index',
                )
                ->withErrors([
                    'error' =>
                    'Produk tersebut tidak dalam keadaan terhapus.',
                ]);
        }

        try {
            $product->restore();

            return redirect()
                ->route(
                    'vendor.products.trash',
                )
                ->with(
                    'message',
                    'Produk berhasil dipulihkan.',
                );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal memulihkan produk',
                [
                    'product_id' =>
                    $product->id,

                    'message' =>
                    $exception->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Produk gagal dipulihkan.',
            ]);
        }
    }

    /**
     * Menjaga kompatibilitas dengan frontend lama sekaligus
     * menambahkan data harga promo pada setiap SKU.
     *
     * @param array<string, mixed> $sku
     *
     * @return array<string, mixed>
     */
    private function catalogSkuPayload(
        array $sku,
    ): array {
        return [
            'id' =>
            (int) $sku['id'],

            'sku' =>
            (string) $sku['sku'],

            /*
             * Alias lama. Nilainya tetap harga normal.
             */
            'price' =>
            (string) $sku['original_price'],

            'original_price' =>
            (string) $sku['original_price'],

            'final_price' =>
            (string) $sku['final_price'],

            'discount_amount' =>
            (string) $sku['discount_amount'],

            'discount_percentage' =>
            (float) $sku['discount_percentage'],

            'has_discount' =>
            (bool) $sku['has_discount'],

            'stock' =>
            (int) $sku['stock'],

            'is_available' =>
            (bool) $sku['is_available'],

            'promotion' =>
            $sku['promotion'],
        ];
    }
}
