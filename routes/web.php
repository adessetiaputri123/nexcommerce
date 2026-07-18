<?php

use App\Http\Controllers\AdminActivityLogController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminPromotionController;
use App\Http\Controllers\AdminTransactionReportController;
use App\Http\Controllers\AdminWithdrawalController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VendorDashboardController;
use App\Http\Controllers\VendorOrderController;
use App\Http\Controllers\VendorWalletController;
use App\Http\Controllers\WithdrawalRequestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Katalog Publik
|--------------------------------------------------------------------------
*/

Route::get(
    '/',
    [ProductController::class, 'indexWeb'],
)->name('catalog');

/*
 * whereNumber() mencegah URL seperti /products/create
 * dianggap sebagai ID produk.
 */
Route::get(
    '/products/{product}',
    [ProductController::class, 'showWeb'],
)
    ->whereNumber('product')
    ->name('products.show');

/*
|--------------------------------------------------------------------------
| Halaman yang Memerlukan Login dan Verifikasi
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth',
    'verified',
])->group(function (): void {
    /*
    |--------------------------------------------------------------------------
    | Dashboard Utama
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        fn() => Inertia::render('Dashboard'),
    )->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Notifikasi
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/notifications',
        [NotificationController::class, 'index'],
    )->name('notifications.index');

    /*
     * read-all harus berada sebelum route parameter
     * {notification}.
     */
    Route::post(
        '/notifications/read-all',
        [
            NotificationController::class,
            'markAllAsRead',
        ],
    )->name('notifications.read-all');

    Route::post(
        '/notifications/{notification}/read',
        [
            NotificationController::class,
            'markAsRead',
        ],
    )
        ->whereUuid('notification')
        ->name('notifications.read');

    /*
    |--------------------------------------------------------------------------
    | Keranjang
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/cart',
        [CartController::class, 'index'],
    )->name('cart.index');

    Route::post(
        '/cart/validate',
        [
            CartController::class,
            'validateForCheckout',
        ],
    )->name('cart.validate');

    Route::post(
        '/cart/items',
        [CartItemController::class, 'store'],
    )->name('cart.items.store');

    Route::patch(
        '/cart/items/{cartItem}',
        [CartItemController::class, 'update'],
    )
        ->whereNumber('cartItem')
        ->name('cart.items.update');

    Route::delete(
        '/cart/items/{cartItem}',
        [CartItemController::class, 'destroy'],
    )
        ->whereNumber('cartItem')
        ->name('cart.items.destroy');

    /*
    |--------------------------------------------------------------------------
    | Checkout
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/checkout',
        [CheckoutController::class, 'show'],
    )->name('checkout.show');

    Route::post(
        '/checkout',
        [CheckoutController::class, 'store'],
    )->name('checkout.store');

    /*
    |--------------------------------------------------------------------------
    | Pesanan Customer
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/orders',
        [OrderController::class, 'index'],
    )->name('orders.index');

    Route::get(
        '/orders/{order}',
        [OrderController::class, 'show'],
    )
        ->whereNumber('order')
        ->name('orders.show');

    Route::post(
        '/orders/{order}/pay',
        [PaymentController::class, 'store'],
    )
        ->whereNumber('order')
        ->name('orders.pay');

    /*
    |--------------------------------------------------------------------------
    | Area Vendor
    |--------------------------------------------------------------------------
    */

    Route::prefix('vendor')
        ->name('vendor.')
        ->group(function (): void {
            /*
            |--------------------------------------------------------------------------
            | Dashboard Vendor
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/dashboard',
                [
                    VendorDashboardController::class,
                    'index',
                ],
            )->name('dashboard');

            /*
            |--------------------------------------------------------------------------
            | Pesanan Vendor
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/orders',
                [
                    VendorOrderController::class,
                    'index',
                ],
            )->name('orders.index');

            Route::patch(
                '/orders/{vendorOrder}/status',
                [
                    VendorOrderController::class,
                    'updateStatus',
                ],
            )
                ->whereNumber('vendorOrder')
                ->name('orders.status');

            /*
            |--------------------------------------------------------------------------
            | Wallet Vendor
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/wallet',
                [
                    VendorWalletController::class,
                    'index',
                ],
            )->name('wallet.index');

            Route::post(
                '/wallets/{wallet}/withdrawals',
                [
                    WithdrawalRequestController::class,
                    'store',
                ],
            )
                ->whereNumber('wallet')
                ->name('wallet.withdrawals.store');

            /*
            |--------------------------------------------------------------------------
            | Manajemen Produk Vendor
            |--------------------------------------------------------------------------
            */

            Route::prefix('products')
                ->name('products.')
                ->group(function (): void {
                    Route::get(
                        '/',
                        [
                            ProductController::class,
                            'manageWeb',
                        ],
                    )->name('index');

                    Route::get(
                        '/create',
                        [
                            ProductController::class,
                            'create',
                        ],
                    )->name('create');

                    Route::post(
                        '/',
                        [
                            ProductController::class,
                            'storeWeb',
                        ],
                    )->name('store');

                    /*
                     * Route trash ditempatkan sebelum
                     * route yang menggunakan {product}.
                     */
                    Route::get(
                        '/trash',
                        [
                            ProductController::class,
                            'trash',
                        ],
                    )->name('trash');

                    Route::get(
                        '/{product}/edit',
                        [
                            ProductController::class,
                            'edit',
                        ],
                    )
                        ->whereNumber('product')
                        ->name('edit');

                    /*
                     * Mendukung PUT, PATCH, dan method
                     * spoofing dari form multipart.
                     */
                    Route::match(
                        [
                            'put',
                            'patch',
                        ],
                        '/{product}',
                        [
                            ProductController::class,
                            'update',
                        ],
                    )
                        ->whereNumber('product')
                        ->name('update');

                    Route::delete(
                        '/{product}',
                        [
                            ProductController::class,
                            'destroy',
                        ],
                    )
                        ->whereNumber('product')
                        ->name('destroy');

                    Route::patch(
                        '/{product}/restore',
                        [
                            ProductController::class,
                            'restore',
                        ],
                    )
                        ->withTrashed()
                        ->whereNumber('product')
                        ->name('restore');

                    /*
                    |--------------------------------------------------------------------------
                    | Galeri Foto Produk
                    |--------------------------------------------------------------------------
                    */

                    Route::patch(
                        '/{product}/images/{image}/primary',
                        [
                            ProductImageController::class,
                            'setPrimary',
                        ],
                    )
                        ->whereNumber('product')
                        ->whereNumber('image')
                        ->name('images.primary');

                    Route::delete(
                        '/{product}/images/{image}',
                        [
                            ProductImageController::class,
                            'destroy',
                        ],
                    )
                        ->whereNumber('product')
                        ->whereNumber('image')
                        ->name('images.destroy');
                });
        });

    /*
    |--------------------------------------------------------------------------
    | Area Admin
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')
        ->name('admin.')
        ->group(function (): void {
            Route::get(
                '/dashboard',
                [
                    AdminDashboardController::class,
                    'index',
                ],
            )->name('dashboard');


            /*
            |--------------------------------------------------------------------------
            | Manajemen Promo
            |--------------------------------------------------------------------------
            */

            Route::prefix('promotions')
                ->name('promotions.')
                ->group(function (): void {
                    Route::get(
                        '/',
                        [
                            AdminPromotionController::class,
                            'index',
                        ],
                    )->name('index');

                    Route::get(
                        '/create',
                        [
                            AdminPromotionController::class,
                            'create',
                        ],
                    )->name('create');

                    Route::post(
                        '/',
                        [
                            AdminPromotionController::class,
                            'store',
                        ],
                    )->name('store');

                    Route::get(
                        '/{promotion}/edit',
                        [
                            AdminPromotionController::class,
                            'edit',
                        ],
                    )
                        ->whereNumber('promotion')
                        ->name('edit');

                    Route::match(
                        [
                            'put',
                            'patch',
                        ],
                        '/{promotion}',
                        [
                            AdminPromotionController::class,
                            'update',
                        ],
                    )
                        ->whereNumber('promotion')
                        ->name('update');

                    Route::patch(
                        '/{promotion}/toggle',
                        [
                            AdminPromotionController::class,
                            'toggle',
                        ],
                    )
                        ->whereNumber('promotion')
                        ->name('toggle');

                    Route::delete(
                        '/{promotion}',
                        [
                            AdminPromotionController::class,
                            'destroy',
                        ],
                    )
                        ->whereNumber('promotion')
                        ->name('destroy');
                });

            Route::get(
                '/activity-logs',
                [
                    AdminActivityLogController::class,
                    'index',
                ],
            )->name('activity-logs.index');

            Route::get(
                '/withdrawals',
                [
                    AdminWithdrawalController::class,
                    'index',
                ],
            )->name('withdrawals.index');

            Route::patch(
                '/withdrawals/{withdrawal}',
                [
                    AdminWithdrawalController::class,
                    'update',
                ],
            )
                ->whereNumber('withdrawal')
                ->name('withdrawals.update');

            /*
             * Route export diletakkan sebelum route
             * laporan utama.
             */
            Route::get(
                '/reports/transactions/export',
                [
                    AdminTransactionReportController::class,
                    'export',
                ],
            )->name('reports.transactions.export');

            Route::get(
                '/reports/transactions',
                [
                    AdminTransactionReportController::class,
                    'index',
                ],
            )->name('reports.transactions.index');
        });

    /*
    |--------------------------------------------------------------------------
    | Route Kompatibilitas Lama
    |--------------------------------------------------------------------------
    |
    | Bagian ini dipertahankan sementara agar halaman lama
    | yang masih memakai products.create, products.edit,
    | products.update, dan products.destroy tidak rusak.
    |
    */

    Route::get(
        '/products/manage',
        fn() => redirect()->route(
            'vendor.products.index',
        ),
    )->name('products.manage');

    Route::get(
        '/products/create',
        [
            ProductController::class,
            'create',
        ],
    )->name('products.create');

    Route::post(
        '/products',
        [
            ProductController::class,
            'storeWeb',
        ],
    )->name('products.store');

    Route::get(
        '/products/{product}/edit',
        [
            ProductController::class,
            'edit',
        ],
    )
        ->whereNumber('product')
        ->name('products.edit');

    Route::match(
        [
            'put',
            'patch',
        ],
        '/products/{product}',
        [
            ProductController::class,
            'update',
        ],
    )
        ->whereNumber('product')
        ->name('products.update');

    Route::delete(
        '/products/{product}',
        [
            ProductController::class,
            'destroy',
        ],
    )
        ->whereNumber('product')
        ->name('products.destroy');

    Route::patch(
        '/products/{product}/restore',
        [
            ProductController::class,
            'restore',
        ],
    )
        ->withTrashed()
        ->whereNumber('product')
        ->name('products.restore');
});

/*
|--------------------------------------------------------------------------
| Profil Pengguna
|--------------------------------------------------------------------------
*/

Route::middleware('auth')
    ->group(function (): void {
        Route::get(
            '/profile',
            [
                ProfileController::class,
                'edit',
            ],
        )->name('profile.edit');

        Route::patch(
            '/profile',
            [
                ProfileController::class,
                'update',
            ],
        )->name('profile.update');

        Route::delete(
            '/profile',
            [
                ProfileController::class,
                'destroy',
            ],
        )->name('profile.destroy');
    });

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

require __DIR__ . '/auth.php';
