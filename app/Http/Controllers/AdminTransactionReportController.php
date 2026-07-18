<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminTransactionReportController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            ActivityLog::class,
        );

        $validated = $this->validateFilters(
            $request,
        );

        $search = trim(
            (string) (
                $validated['search'] ?? ''
            ),
        );

        $paymentStatus = trim(
            (string) (
                $validated['payment_status'] ?? ''
            ),
        );

        $dateFrom =
            $validated['date_from'] ?? '';

        $dateTo =
            $validated['date_to'] ?? '';

        $query = $this->buildFilteredQuery(
            search: $search,
            paymentStatus: $paymentStatus,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
        );

        $summaryQuery = clone $query;

        $summary = [
            'total_orders' => (clone $summaryQuery)
                ->count(),

            'total_transaction_value' =>
            (string) (
                clone $summaryQuery
            )->sum('grand_total'),

            'paid_orders' => (clone $summaryQuery)
                ->where(
                    'payment_status',
                    'paid',
                )
                ->count(),

            'paid_transaction_value' =>
            (string) (
                clone $summaryQuery
            )
                ->where(
                    'payment_status',
                    'paid',
                )
                ->sum('grand_total'),
        ];

        $orders = $query
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(
                function (
                    Order $order,
                ): array {
                    return [
                        'id' =>
                        $order->id,

                        'payment_reference' =>
                        $order->payment_reference,

                        'payment_status' =>
                        $order->payment_status,

                        'grand_total' =>
                        (string) $order->grand_total,

                        'paid_at' =>
                        $order
                            ->paid_at
                            ?->toIso8601String(),

                        'expires_at' =>
                        $order
                            ->expires_at
                            ?->toIso8601String(),

                        'created_at' =>
                        $order
                            ->created_at
                            ?->toIso8601String(),
                    ];
                },
            );

        return Inertia::render(
            'Admin/Reports/Transactions/Index',
            [
                'orders' =>
                $orders,

                'summary' =>
                $summary,

                'filters' => [
                    'search' =>
                    $search,

                    'payment_status' =>
                    $paymentStatus,

                    'date_from' =>
                    $dateFrom,

                    'date_to' =>
                    $dateTo,
                ],
            ],
        );
    }

    public function export(
        Request $request,
    ): StreamedResponse {
        Gate::authorize(
            'viewAny',
            ActivityLog::class,
        );

        $validated = $this->validateFilters(
            $request,
        );

        $search = trim(
            (string) (
                $validated['search'] ?? ''
            ),
        );

        $paymentStatus = trim(
            (string) (
                $validated['payment_status'] ?? ''
            ),
        );

        $dateFrom =
            $validated['date_from'] ?? '';

        $dateTo =
            $validated['date_to'] ?? '';

        $query = $this->buildFilteredQuery(
            search: $search,
            paymentStatus: $paymentStatus,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
        );

        $filename =
            'laporan-transaksi-'
            . now()->format('Y-m-d-His')
            . '.csv';

        return response()->streamDownload(
            function () use ($query): void {
                $handle = fopen(
                    'php://output',
                    'wb',
                );

                if ($handle === false) {
                    return;
                }

                /*
                 * UTF-8 BOM agar karakter Indonesia
                 * terbaca dengan baik di Microsoft Excel.
                 */
                fwrite(
                    $handle,
                    "\xEF\xBB\xBF",
                );

                fputcsv(
                    $handle,
                    [
                        'ID Pesanan',
                        'Referensi Pembayaran',
                        'Status Pembayaran',
                        'Total Transaksi',
                        'Tanggal Dibuat',
                        'Tanggal Dibayar',
                        'Tanggal Kedaluwarsa',
                    ],
                    ';',
                );

                $statusLabels = [
                    'unpaid' =>
                    'Belum Dibayar',

                    'paid' =>
                    'Sudah Dibayar',

                    'expired' =>
                    'Kedaluwarsa',
                ];

                $query
                    ->orderBy('id')
                    ->chunkById(
                        500,
                        function (
                            $orders,
                        ) use (
                            $handle,
                            $statusLabels,
                        ): void {
                            foreach (
                                $orders as $order
                            ) {
                                fputcsv(
                                    $handle,
                                    [
                                        $order->id,

                                        $this->sanitizeCsvCell(
                                            $order
                                                ->payment_reference,
                                        ),

                                        $statusLabels[$order
                                            ->payment_status] ??
                                            $order
                                            ->payment_status,

                                        (string) (
                                            $order
                                            ->grand_total
                                        ),

                                        $order
                                            ->created_at
                                            ?->format(
                                                'Y-m-d H:i:s',
                                            ),

                                        $order
                                            ->paid_at
                                            ?->format(
                                                'Y-m-d H:i:s',
                                            ),

                                        $order
                                            ->expires_at
                                            ?->format(
                                                'Y-m-d H:i:s',
                                            ),
                                    ],
                                    ';',
                                );
                            }
                        },
                    );

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' =>
                'text/csv; charset=UTF-8',

                'Cache-Control' =>
                'no-store, no-cache, must-revalidate',
            ],
        );
    }

    private function validateFilters(
        Request $request,
    ): array {
        return $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'payment_status' => [
                'nullable',
                Rule::in([
                    'unpaid',
                    'paid',
                    'expired',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ]);
    }

    private function buildFilteredQuery(
        string $search,
        string $paymentStatus,
        string $dateFrom,
        string $dateTo,
    ): Builder {
        return Order::query()
            ->when(
                $search !== '',
                function (
                    Builder $query,
                ) use ($search): void {
                    $query->where(
                        function (
                            Builder $subQuery,
                        ) use ($search): void {
                            $subQuery->where(
                                'payment_reference',
                                'like',
                                "%{$search}%",
                            );

                            if (
                                ctype_digit($search)
                            ) {
                                $subQuery->orWhere(
                                    'id',
                                    (int) $search,
                                );
                            }
                        },
                    );
                },
            )
            ->when(
                $paymentStatus !== '',
                fn(Builder $query) =>
                $query->where(
                    'payment_status',
                    $paymentStatus,
                ),
            )
            ->when(
                $dateFrom !== '',
                fn(Builder $query) =>
                $query->whereDate(
                    'created_at',
                    '>=',
                    $dateFrom,
                ),
            )
            ->when(
                $dateTo !== '',
                fn(Builder $query) =>
                $query->whereDate(
                    'created_at',
                    '<=',
                    $dateTo,
                ),
            );
    }

    private function sanitizeCsvCell(
        mixed $value,
    ): string {
        $value = trim(
            (string) ($value ?? ''),
        );

        if ($value === '') {
            return '';
        }

        /*
         * Mencegah data CSV dianggap sebagai
         * formula ketika dibuka melalui Excel.
         */
        if (
            in_array(
                $value[0],
                [
                    '=',
                    '+',
                    '-',
                    '@',
                ],
                true,
            )
        ) {
            return "'{$value}";
        }

        return $value;
    }
}
