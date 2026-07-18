<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateVendorOrderStatusRequest;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Services\ActivityLogService;
use App\Services\TransactionNotificationService;
use App\Services\WalletService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class VendorOrderController extends Controller
{
    public function index(): Response
    {
        Gate::authorize(
            'viewAny',
            VendorOrder::class,
        );

        $vendorIds = $this->accessibleVendorIds(
            request()->user(),
        );

        $vendorOrders = VendorOrder::query()
            ->whereIn(
                'vendor_id',
                $vendorIds,
            )
            ->with([
                'vendor',
                'order.customer',
                'items.productSku.product',
            ])
            ->latest()
            ->get()
            ->map(
                function (
                    VendorOrder $vendorOrder,
                ): array {
                    $items = $vendorOrder
                        ->items
                        ->map(
                            function ($item): array {
                                $sku =
                                    $item->productSku;

                                $product =
                                    $sku?->product;

                                $quantity =
                                    (int) $item->quantity;

                                /*
                                 * Pesanan lama mungkin belum
                                 * mempunyai original_price.
                                 */
                                $originalPrice =
                                    (string) (
                                        $item->original_price
                                        ?? $item->price
                                    );

                                $finalPrice =
                                    (string) $item->price;

                                $originalPriceMinor =
                                    $this->toMinorUnits(
                                        $originalPrice,
                                    );

                                $finalPriceMinor =
                                    $this->toMinorUnits(
                                        $finalPrice,
                                    );

                                $unitDiscountMinor = max(
                                    0,
                                    $originalPriceMinor
                                        - $finalPriceMinor,
                                );

                                $originalTotalMinor =
                                    $originalPriceMinor
                                    * $quantity;

                                $finalTotalMinor =
                                    $finalPriceMinor
                                    * $quantity;

                                $discountTotalMinor = max(
                                    0,
                                    $originalTotalMinor
                                        - $finalTotalMinor,
                                );

                                $hasPromotionSnapshot =
                                    $item->promotion_id
                                    !== null
                                    || $item->promotion_name
                                    !== null;

                                return [
                                    'id' =>
                                    $item->id,

                                    'product_name' =>
                                    $product?->name
                                        ?? 'Produk tidak tersedia',

                                    'sku' =>
                                    $sku?->sku
                                        ?? '-',

                                    'quantity' =>
                                    $quantity,

                                    /*
                                     * Dipertahankan agar halaman
                                     * vendor lama tidak rusak.
                                     */
                                    'price' =>
                                    $finalPrice,

                                    'final_price' =>
                                    $finalPrice,

                                    'original_price' =>
                                    $originalPrice,

                                    'unit_discount_amount' =>
                                    $this->toDecimalString(
                                        $unitDiscountMinor,
                                    ),

                                    'original_total' =>
                                    $this->toDecimalString(
                                        $originalTotalMinor,
                                    ),

                                    'final_total' =>
                                    $this->toDecimalString(
                                        $finalTotalMinor,
                                    ),

                                    'discount_total' =>
                                    $this->toDecimalString(
                                        $discountTotalMinor,
                                    ),

                                    'has_discount' =>
                                    $discountTotalMinor > 0,

                                    /*
                                     * Menggunakan snapshot promo
                                     * pada saat checkout.
                                     */
                                    'promotion' =>
                                    $hasPromotionSnapshot
                                        ? [
                                            'id' =>
                                            $item
                                                ->promotion_id,

                                            'name' =>
                                            $item
                                                ->promotion_name,

                                            'discount_type' =>
                                            $item
                                                ->promotion_discount_type,

                                            'discount_value' =>
                                            $item
                                                ->promotion_discount_value,
                                        ]
                                        : null,
                                ];
                            },
                        )
                        ->values();

                    $originalSubtotalMinor =
                        $items->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this->toMinorUnits(
                                $item['original_total'],
                            ),
                        );

                    $finalSubtotalMinor =
                        $items->sum(
                            fn(
                                array $item,
                            ): int =>
                            $this->toMinorUnits(
                                $item['final_total'],
                            ),
                        );

                    $discountTotalMinor = max(
                        0,
                        $originalSubtotalMinor
                            - $finalSubtotalMinor,
                    );

                    $shippingCostMinor =
                        $this->toMinorUnits(
                            (string) $vendorOrder
                                ->shipping_cost,
                        );

                    $totalMinor =
                        $finalSubtotalMinor
                        + $shippingCostMinor;

                    return [
                        'id' =>
                        $vendorOrder->id,

                        'order_id' =>
                        $vendorOrder->order_id,

                        /*
                         * Subtotal final setelah promo.
                         */
                        'subtotal' =>
                        $vendorOrder->subtotal,

                        'original_subtotal' =>
                        $this->toDecimalString(
                            $originalSubtotalMinor,
                        ),

                        'discount_total' =>
                        $this->toDecimalString(
                            $discountTotalMinor,
                        ),

                        'has_discount' =>
                        $discountTotalMinor > 0,

                        'shipping_cost' =>
                        $vendorOrder->shipping_cost,

                        'total' =>
                        $this->toDecimalString(
                            $totalMinor,
                        ),

                        'delivery_status' =>
                        $vendorOrder
                            ->delivery_status,

                        'payment_status' =>
                        $vendorOrder
                            ->order
                            ->payment_status,

                        'created_at' =>
                        $vendorOrder
                            ->created_at
                            ?->toIso8601String(),

                        'vendor' => [
                            'id' =>
                            $vendorOrder
                                ->vendor
                                ->id,

                            'shop_name' =>
                            $vendorOrder
                                ->vendor
                                ->shop_name,
                        ],

                        'customer' => [
                            'id' =>
                            $vendorOrder
                                ->order
                                ->customer
                                ->id,

                            'name' =>
                            $vendorOrder
                                ->order
                                ->customer
                                ->name,

                            'email' =>
                            $vendorOrder
                                ->order
                                ->customer
                                ->email,
                        ],

                        'items' =>
                        $items->all(),
                    ];
                },
            )
            ->values()
            ->all();

        return Inertia::render(
            'VendorOrders/Index',
            [
                'vendorOrders' =>
                $vendorOrders,
            ],
        );
    }

    public function updateStatus(
        UpdateVendorOrderStatusRequest $request,
        VendorOrder $vendorOrder,
        WalletService $walletService,
        ActivityLogService $activityLogService,
        TransactionNotificationService $transactionNotificationService,
    ): RedirectResponse {
        $validated =
            $request->validated();

        $actor =
            $request->user();

        $statusAfter =
            $validated['delivery_status'];

        $updatedVendorOrder = null;
        $statusBefore = null;

        DB::transaction(
            function () use (
                $validated,
                $vendorOrder,
                $walletService,
                $activityLogService,
                $actor,
                &$updatedVendorOrder,
                &$statusBefore,
            ): void {
                $lockedVendorOrder =
                    VendorOrder::query()
                    ->with([
                        'vendor',
                        'order.customer',
                    ])
                    ->whereKey(
                        $vendorOrder->id,
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                $allowedTransitions = [
                    'confirmed' => [
                        'processing',
                    ],

                    'processing' => [
                        'packed',
                    ],

                    'packed' => [
                        'shipped',
                    ],

                    'shipped' => [
                        'completed',
                    ],
                ];

                $oldStatus =
                    $lockedVendorOrder
                    ->delivery_status;

                $newStatus =
                    $validated['delivery_status'];

                $allowedStatuses =
                    $allowedTransitions[$oldStatus] ?? [];

                if (
                    !in_array(
                        $newStatus,
                        $allowedStatuses,
                        true,
                    )
                ) {
                    throw ValidationException::withMessages([
                        'delivery_status' =>
                        'Status pesanan telah berubah atau transisi tidak diperbolehkan.',
                    ]);
                }

                /*
                 * Simpan status awal agar notifikasi
                 * dapat dikirim setelah transaksi berhasil.
                 */
                $statusBefore =
                    $oldStatus;

                $lockedVendorOrder->update([
                    'delivery_status' =>
                    $newStatus,
                ]);

                /*
                 * Saat selesai, pendapatan masuk
                 * ke wallet vendor.
                 */
                if (
                    $newStatus ===
                    'completed'
                ) {
                    $walletService
                        ->creditCompletedVendorOrder(
                            $lockedVendorOrder,
                        );
                }

                /*
                 * Catat perubahan status ke audit log.
                 */
                $activityLogService->record(
                    action: ActivityLogService::VENDOR_ORDER_STATUS_CHANGED,

                    actor: $actor,

                    subject: $lockedVendorOrder,

                    vendor: $lockedVendorOrder
                        ->vendor,

                    description: "Status pesanan vendor "
                        . "#{$lockedVendorOrder->id} "
                        . "berubah dari {$oldStatus} "
                        . "menjadi {$newStatus}.",

                    properties: [
                        'vendor_order_id' =>
                        $lockedVendorOrder->id,

                        'order_id' =>
                        $lockedVendorOrder
                            ->order_id,

                        'vendor_id' =>
                        $lockedVendorOrder
                            ->vendor_id,

                        'status_before' =>
                        $oldStatus,

                        'status_after' =>
                        $newStatus,
                    ],
                );

                /*
                 * Simpan model terbaru untuk notifikasi
                 * setelah transaksi database berhasil.
                 */
                $updatedVendorOrder =
                    $lockedVendorOrder
                    ->fresh([
                        'vendor',
                        'order.customer',
                    ]);
            },
            attempts: 5,
        );

        /*
         * Notifikasi dikirim setelah transaksi berhasil,
         * bukan ketika transaksi masih berjalan.
         */
        if (
            $updatedVendorOrder !== null
            && $statusBefore !== null
            && $statusBefore !== $statusAfter
        ) {
            $transactionNotificationService
                ->vendorOrderStatusChanged(
                    vendorOrder: $updatedVendorOrder,

                    statusBefore: $statusBefore,

                    statusAfter: $statusAfter,
                );
        }

        return back()->with(
            'message',
            'Status pesanan berhasil diperbarui.',
        );
    }

    private function accessibleVendorIds(
        User $user,
    ): Collection {
        $vendorIds = Vendor::query()
            ->where(
                'owner_id',
                $user->id,
            )
            ->pluck('id')
            ->map(
                fn($id): int =>
                (int) $id,
            );

        if (
            $user->vendor_id !== null
        ) {
            $vendorIds->push(
                (int) $user->vendor_id,
            );
        }

        return $vendorIds
            ->unique()
            ->values();
    }

    private function toMinorUnits(
        string $amount,
    ): int {
        [$whole, $fraction] =
            array_pad(
                explode(
                    '.',
                    $amount,
                    2,
                ),
                2,
                '0',
            );

        $fraction = str_pad(
            substr(
                $fraction,
                0,
                2,
            ),
            2,
            '0',
        );

        return (
            (int) $whole * 100
        ) + (int) $fraction;
    }

    private function toDecimalString(
        int $amount,
    ): string {
        $whole =
            intdiv(
                $amount,
                100,
            );

        $fraction =
            abs(
                $amount % 100,
            );

        return sprintf(
            '%d.%02d',
            $whole,
            $fraction,
        );
    }
}
