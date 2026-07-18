import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
} from '@inertiajs/react';
import {
    useMemo,
    useState,
} from 'react';

const PAYMENT_STATUS_OPTIONS = [
    {
        value: 'all',
        label: 'Semua Status',
    },
    {
        value: 'unpaid',
        label: 'Belum Dibayar',
    },
    {
        value: 'pending',
        label: 'Menunggu Pembayaran',
    },
    {
        value: 'paid',
        label: 'Sudah Dibayar',
    },
    {
        value: 'failed',
        label: 'Pembayaran Gagal',
    },
    {
        value: 'expired',
        label: 'Kedaluwarsa',
    },
    {
        value: 'refunded',
        label: 'Dikembalikan',
    },
];

export default function Index({
    orders = [],
}) {
    const [search, setSearch] =
        useState('');

    const [
        paymentStatus,
        setPaymentStatus,
    ] = useState('all');

    const orderItems =
        Array.isArray(orders)
            ? orders
            : orders?.data ?? [];

    const filteredOrders =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return orderItems.filter(
                (order) => {
                    const matchesStatus =
                        paymentStatus ===
                        'all' ||
                        order.payment_status ===
                        paymentStatus;

                    if (!matchesStatus) {
                        return false;
                    }

                    if (!keyword) {
                        return true;
                    }

                    const vendors =
                        Array.isArray(
                            order.vendors,
                        )
                            ? order.vendors
                            : [];

                    const searchableText = [
                        order.id,
                        order.payment_reference,
                        order.payment_status,
                        ...vendors.map(
                            (vendor) =>
                                vendor.shop_name,
                        ),
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return searchableText.includes(
                        keyword,
                    );
                },
            );
        }, [
            orderItems,
            paymentStatus,
            search,
        ]);

    const resetFilters = () => {
        setSearch('');
        setPaymentStatus('all');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pesanan Saya" />

            <div className="space-y-6">
                <PageHeader
                    totalOrders={
                        orderItems.length
                    }
                />

                {orderItems.length >
                    0 ? (
                    <>
                        <OrderFilters
                            search={search}
                            paymentStatus={
                                paymentStatus
                            }
                            onSearchChange={
                                setSearch
                            }
                            onPaymentStatusChange={
                                setPaymentStatus
                            }
                            onReset={
                                resetFilters
                            }
                        />

                        {filteredOrders.length ===
                            0 ? (
                            <EmptyFilterResult
                                onReset={
                                    resetFilters
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-4 lg:hidden">
                                    {filteredOrders.map(
                                        (order) => (
                                            <OrderCard
                                                key={
                                                    order.id
                                                }
                                                order={
                                                    order
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <OrdersTable
                                    orders={
                                        filteredOrders
                                    }
                                />

                                <Pagination
                                    links={
                                        Array.isArray(
                                            orders?.links,
                                        )
                                            ? orders.links
                                            : []
                                    }
                                />
                            </>
                        )}
                    </>
                ) : (
                    <EmptyOrders />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({
    totalOrders,
}) {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Riwayat transaksi
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Pesanan Saya
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Pantau pembayaran dan status pengiriman dari{' '}
                    {totalOrders}{' '}
                    pesanan.
                </p>
            </div>

            <Link
                href={route(
                    'catalog',
                )}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
                <Icon
                    name="store"
                    className="h-5 w-5"
                />

                Belanja Lagi
            </Link>
        </section>
    );
}

function OrderFilters({
    search,
    paymentStatus,
    onSearchChange,
    onPaymentStatusChange,
    onReset,
}) {
    const hasFilter =
        search.trim() !== '' ||
        paymentStatus !== 'all';

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto]">
                <div>
                    <label
                        htmlFor="order-search"
                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                        Cari Pesanan
                    </label>

                    <div className="relative">
                        <Icon
                            name="search"
                            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            id="order-search"
                            type="search"
                            value={search}
                            onChange={(event) =>
                                onSearchChange(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Nomor pesanan, referensi, atau nama toko..."
                            className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm shadow-none focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="payment-status"
                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                        Status Pembayaran
                    </label>

                    <select
                        id="payment-status"
                        value={
                            paymentStatus
                        }
                        onChange={(event) =>
                            onPaymentStatusChange(
                                event.target
                                    .value,
                            )
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 text-sm shadow-none focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                    >
                        {PAYMENT_STATUS_OPTIONS.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={
                            !hasFilter
                        }
                        className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
                    >
                        <Icon
                            name="reset"
                            className="h-4 w-4"
                        />

                        Reset
                    </button>
                </div>
            </div>
        </section>
    );
}

function OrdersTable({
    orders,
}) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <TableHeading>
                                Pesanan
                            </TableHeading>

                            <TableHeading>
                                Tanggal
                            </TableHeading>

                            <TableHeading>
                                Toko
                            </TableHeading>

                            <TableHeading>
                                Pembayaran
                            </TableHeading>

                            <TableHeading align="right">
                                Total
                            </TableHeading>

                            <TableHeading align="right">
                                Aksi
                            </TableHeading>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {orders.map(
                            (order) => (
                                <OrderTableRow
                                    key={
                                        order.id
                                    }
                                    order={
                                        order
                                    }
                                />
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function TableHeading({
    children,
    align = 'left',
}) {
    return (
        <th
            className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${align === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
        >
            {children}
        </th>
    );
}

function OrderTableRow({
    order,
}) {
    const vendors =
        Array.isArray(
            order.vendors,
        )
            ? order.vendors
            : [];

    const paymentStatus =
        getPaymentStatus(
            order.payment_status,
        );

    return (
        <tr className="align-top transition hover:bg-slate-50">
            <td className="px-5 py-4">
                <p className="font-black text-slate-900">
                    Pesanan #
                    {order.id}
                </p>

                {order.payment_reference && (
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                        {
                            order.payment_reference
                        }
                    </p>
                )}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-600">
                {formatDate(
                    order.created_at,
                )}
            </td>

            <td className="px-5 py-4">
                <VendorSummary
                    vendors={
                        vendors
                    }
                    count={
                        order.vendor_order_count
                    }
                />
            </td>

            <td className="px-5 py-4">
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${paymentStatus.className}`}
                >
                    {
                        paymentStatus.label
                    }
                </span>
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-right text-base font-black text-emerald-700">
                {formatCurrency(
                    order.grand_total,
                )}
            </td>

            <td className="px-5 py-4 text-right">
                <Link
                    href={route(
                        'orders.show',
                        order.id,
                    )}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-indigo-700 transition hover:bg-indigo-50"
                    aria-label={`Lihat detail pesanan ${order.id}`}
                    title="Lihat Detail"
                >
                    <Icon
                        name="eye"
                        className="h-5 w-5"
                    />
                </Link>
            </td>
        </tr>
    );
}

function OrderCard({
    order,
}) {
    const vendors =
        Array.isArray(
            order.vendors,
        )
            ? order.vendors
            : [];

    const paymentStatus =
        getPaymentStatus(
            order.payment_status,
        );

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-black text-slate-900">
                        Pesanan #
                        {
                            order.id
                        }
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDate(
                            order.created_at,
                        )}
                    </p>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${paymentStatus.className}`}
                >
                    {
                        paymentStatus.label
                    }
                </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Grand Total
                </p>

                <p className="mt-1 text-2xl font-black text-emerald-700">
                    {formatCurrency(
                        order.grand_total,
                    )}
                </p>
            </div>

            <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Toko dalam pesanan
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                    {vendors.length >
                        0 ? (
                        vendors.map(
                            (vendor) => {
                                const deliveryStatus =
                                    getDeliveryStatus(
                                        vendor.delivery_status,
                                    );

                                return (
                                    <span
                                        key={
                                            vendor.id
                                        }
                                        className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                                    >
                                        <span className="truncate">
                                            {
                                                vendor.shop_name
                                            }
                                        </span>

                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${deliveryStatus.className}`}
                                        >
                                            {
                                                deliveryStatus.label
                                            }
                                        </span>
                                    </span>
                                );
                            },
                        )
                    ) : (
                        <span className="text-sm text-slate-500">
                            Data toko tidak tersedia.
                        </span>
                    )}
                </div>
            </div>

            <Link
                href={route(
                    'orders.show',
                    order.id,
                )}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            >
                Lihat Detail

                <Icon
                    name="arrowRight"
                    className="h-4 w-4"
                />
            </Link>
        </article>
    );
}

function VendorSummary({
    vendors,
    count,
}) {
    const visibleVendors =
        vendors.slice(
            0,
            2,
        );

    const remaining =
        Math.max(
            0,
            vendors.length -
            visibleVendors.length,
        );

    return (
        <div className="space-y-1.5">
            {visibleVendors.map(
                (vendor) => {
                    const status =
                        getDeliveryStatus(
                            vendor.delivery_status,
                        );

                    return (
                        <div
                            key={
                                vendor.id
                            }
                            className="flex items-center gap-2"
                        >
                            <span className="max-w-40 truncate text-sm font-bold text-slate-700">
                                {
                                    vendor.shop_name
                                }
                            </span>

                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${status.className}`}
                            >
                                {
                                    status.label
                                }
                            </span>
                        </div>
                    );
                },
            )}

            {remaining >
                0 && (
                    <p className="text-xs font-bold text-slate-400">
                        +{remaining}{' '}
                        toko lainnya
                    </p>
                )}

            {vendors.length ===
                0 && (
                    <p className="text-sm font-semibold text-slate-500">
                        {Number(
                            count ??
                            0,
                        )}{' '}
                        pesanan toko
                    </p>
                )}
        </div>
    );
}

function EmptyOrders() {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Icon
                    name="orders"
                    className="h-10 w-10"
                />
            </span>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
                Belum ada pesanan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Pesanan yang berhasil dibuat akan ditampilkan di halaman ini.
            </p>

            <Link
                href={route(
                    'catalog',
                )}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
            >
                <Icon
                    name="store"
                    className="h-5 w-5"
                />

                Mulai Belanja
            </Link>
        </section>
    );
}

function EmptyFilterResult({
    onReset,
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon
                    name="search"
                    className="h-8 w-8"
                />
            </span>

            <h2 className="mt-5 text-xl font-black text-slate-900">
                Pesanan tidak ditemukan
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                Coba ubah kata pencarian atau filter status.
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            >
                Reset Filter
            </button>
        </section>
    );
}

function Pagination({
    links = [],
}) {
    if (
        links.length <=
        3
    ) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2">
            {links.map(
                (
                    link,
                    index,
                ) => (
                    <Link
                        key={`${link.label}-${index}`}
                        href={
                            link.url ??
                            '#'
                        }
                        preserveScroll
                        className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition ${link.active
                                ? 'bg-indigo-600 text-white'
                                : link.url
                                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                            }`}
                        dangerouslySetInnerHTML={{
                            __html:
                                link.label,
                        }}
                    />
                ),
            )}
        </nav>
    );
}

function getPaymentStatus(
    status,
) {
    const statuses = {
        unpaid: {
            label:
                'Belum Dibayar',
            className:
                'bg-amber-100 text-amber-700',
        },
        pending: {
            label:
                'Menunggu Pembayaran',
            className:
                'bg-blue-100 text-blue-700',
        },
        paid: {
            label:
                'Sudah Dibayar',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        failed: {
            label:
                'Pembayaran Gagal',
            className:
                'bg-red-100 text-red-700',
        },
        expired: {
            label:
                'Kedaluwarsa',
            className:
                'bg-slate-200 text-slate-700',
        },
        refunded: {
            label:
                'Dikembalikan',
            className:
                'bg-violet-100 text-violet-700',
        },
    };

    return statuses[status] ?? {
        label:
            status ??
            'Tidak diketahui',
        className:
            'bg-slate-100 text-slate-700',
    };
}

function getDeliveryStatus(
    status,
) {
    const statuses = {
        pending: {
            label:
                'Menunggu',
            className:
                'bg-amber-100 text-amber-700',
        },
        confirmed: {
            label:
                'Dikonfirmasi',
            className:
                'bg-blue-100 text-blue-700',
        },
        processing: {
            label:
                'Diproses',
            className:
                'bg-indigo-100 text-indigo-700',
        },
        packed: {
            label:
                'Dikemas',
            className:
                'bg-violet-100 text-violet-700',
        },
        shipped: {
            label:
                'Dikirim',
            className:
                'bg-cyan-100 text-cyan-700',
        },
        completed: {
            label:
                'Selesai',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        cancelled: {
            label:
                'Dibatalkan',
            className:
                'bg-red-100 text-red-700',
        },
        expired: {
            label:
                'Kedaluwarsa',
            className:
                'bg-slate-200 text-slate-700',
        },
    };

    return statuses[status] ?? {
        label:
            status ??
            '-',
        className:
            'bg-slate-100 text-slate-700',
    };
}

function formatCurrency(
    value,
) {
    const number =
        Number(
            value ?? 0,
        );

    return `Rp ${Number.isFinite(
        number,
    )
        ? number.toLocaleString(
            'id-ID',
            {
                maximumFractionDigits:
                    0,
            },
        )
        : '0'}`;
}

function parseOrderDateTime(
    value,
) {
    if (!value) {
        return null;
    }

    const normalized =
        String(value).trim();

    const localWitaMatch =
        normalized.match(
            /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/,
        );

    const parseValue =
        localWitaMatch
            ? `${localWitaMatch[1]}-${localWitaMatch[2]}-${localWitaMatch[3]}T${localWitaMatch[4]}:${localWitaMatch[5]}:${localWitaMatch[6] ?? '00'}+08:00`
            : normalized;

    const timestamp =
        Date.parse(parseValue);

    return Number.isNaN(
        timestamp,
    )
        ? null
        : timestamp;
}

function formatDate(
    value,
) {
    const timestamp =
        parseOrderDateTime(
            value,
        );

    if (
        timestamp ===
        null
    ) {
        return '-';
    }

    return `${new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone:
                'Asia/Makassar',
            dateStyle:
                'medium',
            timeStyle:
                'short',
        },
    ).format(
        new Date(
            timestamp,
        ),
    )} WITA`;
}

function Icon({
    name,
    className =
    'h-5 w-5',
}) {
    const props = {
        className,
        viewBox:
            '0 0 24 24',
        fill: 'none',
        stroke:
            'currentColor',
        strokeWidth:
            1.8,
        strokeLinecap:
            'round',
        strokeLinejoin:
            'round',
        'aria-hidden':
            true,
    };

    const icons = {
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
            </>
        ),
        search: (
            <>
                <circle
                    cx="11"
                    cy="11"
                    r="7"
                />
                <path d="m20 20-3.2-3.2" />
            </>
        ),
        reset: (
            <>
                <path d="M4 4v6h6" />
                <path d="M20 20v-6h-6" />
                <path d="M5.5 15a8 8 0 0 0 13-3" />
                <path d="M18.5 9a8 8 0 0 0-13-3" />
            </>
        ),
        eye: (
            <>
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
            </>
        ),
        orders: (
            <>
                <path d="M7 3h10l2 3v15H5V6l2-3Z" />
                <path d="M5 7h14" />
                <path d="M9 11h6" />
                <path d="M9 15h6" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.orders}
        </svg>
    );
}