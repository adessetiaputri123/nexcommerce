<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePromotionRequest;
use App\Http\Requests\UpdatePromotionRequest;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminPromotionController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            Promotion::class,
        );

        $search = trim(
            (string) $request->input(
                'search',
                '',
            ),
        );

        $status = $request->input(
            'status',
            'all',
        );

        $campaignType = $request->input(
            'campaign_type',
            'all',
        );

        $moment = now();

        $promotions = Promotion::query()
            ->with([
                'creator:id,name,email',
            ])
            ->withCount('products')
            ->when(
                $search !== '',
                function (
                    Builder $query,
                ) use (
                    $search,
                ): void {
                    $query->where(
                        function (
                            Builder $nestedQuery,
                        ) use (
                            $search,
                        ): void {
                            $nestedQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'description',
                                    'like',
                                    "%{$search}%",
                                );
                        },
                    );
                },
            )
            ->when(
                $campaignType !== 'all',
                fn(
                    Builder $query,
                ): Builder =>
                $query->where(
                    'campaign_type',
                    $campaignType,
                ),
            )
            ->when(
                $status === 'active',
                fn(
                    Builder $query,
                ): Builder =>
                $query
                    ->where(
                        'is_active',
                        true,
                    )
                    ->where(
                        'starts_at',
                        '<=',
                        $moment,
                    )
                    ->where(
                        'ends_at',
                        '>=',
                        $moment,
                    ),
            )
            ->when(
                $status === 'scheduled',
                fn(
                    Builder $query,
                ): Builder =>
                $query
                    ->where(
                        'is_active',
                        true,
                    )
                    ->where(
                        'starts_at',
                        '>',
                        $moment,
                    ),
            )
            ->when(
                $status === 'expired',
                fn(
                    Builder $query,
                ): Builder =>
                $query->where(
                    'ends_at',
                    '<',
                    $moment,
                ),
            )
            ->when(
                $status === 'inactive',
                fn(
                    Builder $query,
                ): Builder =>
                $query->where(
                    'is_active',
                    false,
                ),
            )
            ->orderByDesc('priority')
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(
                fn(
                    Promotion $promotion,
                ): array => [
                    'id' =>
                    $promotion->id,

                    'name' =>
                    $promotion->name,

                    'description' =>
                    $promotion->description,

                    'campaign_type' =>
                    $promotion->campaign_type,

                    'campaign_label' =>
                    $this->campaignLabel(
                        $promotion->campaign_type,
                    ),

                    'discount_type' =>
                    $promotion->discount_type,

                    'discount_value' =>
                    (string) $promotion
                        ->discount_value,

                    'discount_label' =>
                    $promotion
                        ->discount_label,

                    'minimum_order_amount' =>
                    $promotion
                        ->minimum_order_amount,

                    'maximum_discount_amount' =>
                    $promotion
                        ->maximum_discount_amount,

                    'starts_at' =>
                    $promotion
                        ->starts_at
                        ?->toISOString(),

                    'ends_at' =>
                    $promotion
                        ->ends_at
                        ?->toISOString(),

                    'priority' =>
                    (int) $promotion->priority,

                    'is_active' =>
                    (bool) $promotion->is_active,

                    'status' =>
                    $this->promotionStatus(
                        $promotion,
                        $moment,
                    ),

                    'products_count' =>
                    (int) $promotion
                        ->products_count,

                    'creator' =>
                    $promotion->creator
                        ? [
                            'id' =>
                            $promotion
                                ->creator
                                ->id,

                            'name' =>
                            $promotion
                                ->creator
                                ->name,

                            'email' =>
                            $promotion
                                ->creator
                                ->email,
                        ]
                        : null,

                    'created_at' =>
                    $promotion
                        ->created_at
                        ?->toISOString(),
                ],
            );

        $statistics = [
            'total' =>
            Promotion::query()->count(),

            'active' =>
            Promotion::query()
                ->where(
                    'is_active',
                    true,
                )
                ->where(
                    'starts_at',
                    '<=',
                    $moment,
                )
                ->where(
                    'ends_at',
                    '>=',
                    $moment,
                )
                ->count(),

            'scheduled' =>
            Promotion::query()
                ->where(
                    'is_active',
                    true,
                )
                ->where(
                    'starts_at',
                    '>',
                    $moment,
                )
                ->count(),

            'inactive' =>
            Promotion::query()
                ->where(
                    'is_active',
                    false,
                )
                ->count(),

            'expired' =>
            Promotion::query()
                ->where(
                    'ends_at',
                    '<',
                    $moment,
                )
                ->count(),
        ];

        return Inertia::render(
            'Admin/Promotions/Index',
            [
                'promotions' =>
                $promotions,

                'statistics' =>
                $statistics,

                'filters' => [
                    'search' =>
                    $search,

                    'status' =>
                    $status,

                    'campaign_type' =>
                    $campaignType,
                ],

                'campaignTypes' =>
                $this->campaignTypes(),
            ],
        );
    }

    public function create(): Response
    {
        Gate::authorize(
            'create',
            Promotion::class,
        );

        return Inertia::render(
            'Admin/Promotions/Create',
            [
                'products' =>
                $this->productOptions(),

                'campaignTypes' =>
                $this->campaignTypes(),

                'discountTypes' =>
                $this->discountTypes(),
            ],
        );
    }

    public function store(
        StorePromotionRequest $request,
    ): RedirectResponse {
        $validated =
            $request->validated();

        $productIds =
            $this->normalizeProductIds(
                $validated['product_ids'],
            );

        unset(
            $validated['product_ids'],
        );

        try {
            DB::transaction(
                function () use (
                    $request,
                    $validated,
                    $productIds,
                ): void {
                    $promotion =
                        Promotion::query()
                        ->create([
                            ...$validated,

                            'created_by' =>
                            $request
                                ->user()
                                ->id,
                        ]);

                    $promotion
                        ->products()
                        ->sync(
                            $productIds,
                        );
                },
                attempts: 5,
            );

            return redirect()
                ->route(
                    'admin.promotions.index',
                )
                ->with(
                    'message',
                    'Promo berhasil dibuat dan dijadwalkan.',
                );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal membuat promo',
                [
                    'user_id' =>
                    $request
                        ->user()
                        ->id,

                    'message' =>
                    $exception
                        ->getMessage(),
                ],
            );

            return back()
                ->withInput()
                ->withErrors([
                    'error' =>
                    'Promo gagal dibuat. Silakan coba kembali.',
                ]);
        }
    }

    public function edit(
        Promotion $promotion,
    ): Response {
        Gate::authorize(
            'update',
            $promotion,
        );

        $promotion->load([
            'products:id',
        ]);

        return Inertia::render(
            'Admin/Promotions/Edit',
            [
                'promotion' => [
                    'id' =>
                    $promotion->id,

                    'name' =>
                    $promotion->name,

                    'description' =>
                    $promotion->description,

                    'campaign_type' =>
                    $promotion
                        ->campaign_type,

                    'discount_type' =>
                    $promotion
                        ->discount_type,

                    'discount_value' =>
                    (string) $promotion
                        ->discount_value,

                    'minimum_order_amount' =>
                    $promotion
                        ->minimum_order_amount,

                    'maximum_discount_amount' =>
                    $promotion
                        ->maximum_discount_amount,

                    /*
                     * Format ini sesuai input
                     * datetime-local pada React.
                     */
                    'starts_at' =>
                    $promotion
                        ->starts_at
                        ?->format(
                            'Y-m-d\TH:i',
                        ),

                    'ends_at' =>
                    $promotion
                        ->ends_at
                        ?->format(
                            'Y-m-d\TH:i',
                        ),

                    'priority' =>
                    (int) $promotion
                        ->priority,

                    'is_active' =>
                    (bool) $promotion
                        ->is_active,

                    'product_ids' =>
                    $promotion
                        ->products
                        ->pluck('id')
                        ->map(
                            fn($id): int =>
                            (int) $id,
                        )
                        ->values()
                        ->all(),
                ],

                'products' =>
                $this->productOptions(),

                'campaignTypes' =>
                $this->campaignTypes(),

                'discountTypes' =>
                $this->discountTypes(),
            ],
        );
    }

    public function update(
        UpdatePromotionRequest $request,
        Promotion $promotion,
    ): RedirectResponse {
        $validated =
            $request->validated();

        $productIds =
            $this->normalizeProductIds(
                $validated['product_ids'],
            );

        unset(
            $validated['product_ids'],
        );

        try {
            DB::transaction(
                function () use (
                    $promotion,
                    $validated,
                    $productIds,
                ): void {
                    $lockedPromotion =
                        Promotion::query()
                        ->whereKey(
                            $promotion->id,
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                    $lockedPromotion->update(
                        $validated,
                    );

                    $lockedPromotion
                        ->products()
                        ->sync(
                            $productIds,
                        );
                },
                attempts: 5,
            );

            return redirect()
                ->route(
                    'admin.promotions.index',
                )
                ->with(
                    'message',
                    'Promo berhasil diperbarui.',
                );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal memperbarui promo',
                [
                    'promotion_id' =>
                    $promotion->id,

                    'user_id' =>
                    $request
                        ->user()
                        ->id,

                    'message' =>
                    $exception
                        ->getMessage(),
                ],
            );

            return back()
                ->withInput()
                ->withErrors([
                    'error' =>
                    'Promo gagal diperbarui. Silakan coba kembali.',
                ]);
        }
    }

    public function toggle(
        Request $request,
        Promotion $promotion,
    ): RedirectResponse {
        Gate::authorize(
            'update',
            $promotion,
        );

        try {
            DB::transaction(
                function () use (
                    $promotion,
                ): void {
                    $lockedPromotion =
                        Promotion::query()
                        ->whereKey(
                            $promotion->id,
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                    $lockedPromotion->update([
                        'is_active' =>
                        !$lockedPromotion
                            ->is_active,
                    ]);
                },
                attempts: 5,
            );

            $promotion->refresh();

            return back()->with(
                'message',
                $promotion->is_active
                    ? 'Promo berhasil diaktifkan.'
                    : 'Promo berhasil dinonaktifkan.',
            );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal mengubah status promo',
                [
                    'promotion_id' =>
                    $promotion->id,

                    'user_id' =>
                    $request
                        ->user()
                        ->id,

                    'message' =>
                    $exception
                        ->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Status promo gagal diperbarui.',
            ]);
        }
    }

    public function destroy(
        Request $request,
        Promotion $promotion,
    ): RedirectResponse {
        Gate::authorize(
            'delete',
            $promotion,
        );

        try {
            DB::transaction(
                function () use (
                    $promotion,
                ): void {
                    $lockedPromotion =
                        Promotion::query()
                        ->whereKey(
                            $promotion->id,
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                    $lockedPromotion
                        ->products()
                        ->detach();

                    $lockedPromotion->delete();
                },
                attempts: 5,
            );

            return redirect()
                ->route(
                    'admin.promotions.index',
                )
                ->with(
                    'message',
                    'Promo berhasil dihapus.',
                );
        } catch (Throwable $exception) {
            Log::error(
                'Gagal menghapus promo',
                [
                    'promotion_id' =>
                    $promotion->id,

                    'user_id' =>
                    $request
                        ->user()
                        ->id,

                    'message' =>
                    $exception
                        ->getMessage(),
                ],
            );

            return back()->withErrors([
                'error' =>
                'Promo gagal dihapus.',
            ]);
        }
    }

    /**
     * @return array<int, array{
     *     id: int,
     *     name: string,
     *     vendor_name: string,
     *     label: string
     * }>
     */
    private function productOptions(): array
    {
        return Product::query()
            ->with([
                'vendor:id,shop_name',
            ])
            ->orderBy('name')
            ->get([
                'id',
                'vendor_id',
                'name',
            ])
            ->map(
                fn(
                    Product $product,
                ): array => [
                    'id' =>
                    $product->id,

                    'name' =>
                    $product->name,

                    'vendor_name' =>
                    $product
                        ->vendor
                        ?->shop_name
                        ?? 'Tanpa Vendor',

                    'label' =>
                    $product->name
                        . ' — '
                        . (
                            $product
                            ->vendor
                            ?->shop_name
                            ?? 'Tanpa Vendor'
                        ),
                ],
            )
            ->values()
            ->all();
    }

    /**
     * @param array<int, mixed> $productIds
     *
     * @return array<int, int>
     */
    private function normalizeProductIds(
        array $productIds,
    ): array {
        return collect($productIds)
            ->map(
                fn($productId): int =>
                (int) $productId,
            )
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{
     *     value: string,
     *     label: string
     * }>
     */
    private function campaignTypes(): array
    {
        return [
            [
                'value' =>
                Promotion::CAMPAIGN_TWIN_DATE,

                'label' =>
                'Tanggal Kembar',
            ],
            [
                'value' =>
                Promotion::CAMPAIGN_START_MONTH,

                'label' =>
                'Awal Bulan',
            ],
            [
                'value' =>
                Promotion::CAMPAIGN_END_MONTH,

                'label' =>
                'Akhir Bulan',
            ],
            [
                'value' =>
                Promotion::CAMPAIGN_HOLIDAY,

                'label' =>
                'Hari Raya atau Libur',
            ],
            [
                'value' =>
                Promotion::CAMPAIGN_CELEBRATION,

                'label' =>
                'Perayaan Khusus',
            ],
            [
                'value' =>
                Promotion::CAMPAIGN_CUSTOM,

                'label' =>
                'Promo Custom',
            ],
        ];
    }

    /**
     * @return array<int, array{
     *     value: string,
     *     label: string
     * }>
     */
    private function discountTypes(): array
    {
        return [
            [
                'value' =>
                Promotion::DISCOUNT_PERCENTAGE,

                'label' =>
                'Persentase',
            ],
            [
                'value' =>
                Promotion::DISCOUNT_FIXED,

                'label' =>
                'Potongan Nominal',
            ],
        ];
    }

    private function campaignLabel(
        string $campaignType,
    ): string {
        return match ($campaignType) {
            Promotion::CAMPAIGN_TWIN_DATE =>
            'Tanggal Kembar',

            Promotion::CAMPAIGN_START_MONTH =>
            'Awal Bulan',

            Promotion::CAMPAIGN_END_MONTH =>
            'Akhir Bulan',

            Promotion::CAMPAIGN_HOLIDAY =>
            'Hari Raya atau Libur',

            Promotion::CAMPAIGN_CELEBRATION =>
            'Perayaan Khusus',

            default =>
            'Promo Custom',
        };
    }

    private function promotionStatus(
        Promotion $promotion,
        mixed $moment,
    ): string {
        if (!$promotion->is_active) {
            return 'inactive';
        }

        if (
            $promotion->starts_at
            && $promotion->starts_at
            ->greaterThan($moment)
        ) {
            return 'scheduled';
        }

        if (
            $promotion->ends_at
            && $promotion->ends_at
            ->lessThan($moment)
        ) {
            return 'expired';
        }

        return 'active';
    }
}
