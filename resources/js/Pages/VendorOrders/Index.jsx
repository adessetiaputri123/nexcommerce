import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import {
    useMemo,
    useState,
} from 'react';

const STATUS_OPTIONS = [
    ['all', 'Semua Status'],
    ['confirmed', 'Dikonfirmasi'],
    ['processing', 'Diproses'],
    ['packed', 'Dikemas'],
    ['shipped', 'Dikirim'],
    ['completed', 'Selesai'],
    ['cancelled', 'Dibatalkan'],
];

const NEXT_STATUS = {
    confirmed: 'processing',
    processing: 'packed',
    packed: 'shipped',
    shipped: 'completed',
};

const NEXT_ACTION = {
    processing: 'Mulai Proses',
    packed: 'Tandai Dikemas',
    shipped: 'Tandai Dikirim',
    completed: 'Selesaikan Pesanan',
};

export default function Index({
    vendorOrders = [],
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const [processingOrderId, setProcessingOrderId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const orderItems = Array.isArray(vendorOrders)
        ? vendorOrders
        : Array.isArray(vendorOrders?.data)
            ? vendorOrders.data
            : [];

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return orderItems.filter((order) => {
            if (
                statusFilter !== 'all' &&
                order.delivery_status !== statusFilter
            ) {
                return false;
            }

            if (!keyword) return true;

            const items = Array.isArray(order.items) ? order.items : [];

            return [
                order.order_id,
                order.vendor?.shop_name,
                order.customer?.name,
                order.customer?.email,
                ...items.map((item) => item.product_name),
                ...items.map((item) => item.sku),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(keyword);
        });
    }, [orderItems, search, statusFilter]);

    const statistics = useMemo(
        () =>
            orderItems.reduce(
                (result, order) => {
                    result.total += 1;
                    result.revenue += Number(order.subtotal ?? 0);

                    if (order.delivery_status === 'processing') {
                        result.processing += 1;
                    }

                    if (order.delivery_status === 'shipped') {
                        result.shipped += 1;
                    }

                    if (order.delivery_status === 'completed') {
                        result.completed += 1;
                    }

                    return result;
                },
                {
                    total: 0,
                    processing: 0,
                    shipped: 0,
                    completed: 0,
                    revenue: 0,
                },
            ),
        [orderItems],
    );

    const updateStatus = (vendorOrder) => {
        const nextStatus = NEXT_STATUS[vendorOrder.delivery_status];

        if (!nextStatus) return;

        if (
            !window.confirm(
                `Ubah status menjadi "${getDeliveryStatus(nextStatus).label}"?`,
            )
        ) {
            return;
        }

        router.patch(
            route('vendor.orders.status', vendorOrder.id),
            {
                delivery_status: nextStatus,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessingOrderId(vendorOrder.id),
                onFinish: () => setProcessingOrderId(null),
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pesanan Vendor" />

            <div className="space-y-6">
                <section>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                        Operasional toko
                    </p>
                    <h1 className="mt-1 text-3xl font-black text-slate-900">
                        Pesanan Vendor
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Kelola proses, pengemasan, pengiriman, dan penyelesaian
                        pesanan customer.
                    </p>
                </section>

                {flash?.message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(flash?.error ||
                    errors?.error ||
                    errors?.delivery_status) && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                            {flash?.error ??
                                errors?.error ??
                                errors?.delivery_status}
                        </div>
                    )}

                <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    <Stat label="Total Pesanan" value={statistics.total} />
                    <Stat label="Diproses" value={statistics.processing} />
                    <Stat label="Dikirim" value={statistics.shipped} />
                    <Stat label="Selesai" value={statistics.completed} />
                    <Stat
                        label="Pendapatan Produk"
                        value={formatCurrency(statistics.revenue)}
                    />
                </section>

                {orderItems.length > 0 ? (
                    <>
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
                                <div>
                                    <label
                                        htmlFor="vendor-order-search"
                                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                                    >
                                        Cari Pesanan
                                    </label>

                                    <input
                                        id="vendor-order-search"
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Nomor pesanan, customer, produk, atau SKU..."
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="delivery-filter"
                                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                                    >
                                        Status Pengiriman
                                    </label>

                                    <select
                                        id="delivery-filter"
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                    >
                                        {STATUS_OPTIONS.map(
                                            ([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        disabled={
                                            !search &&
                                            statusFilter === 'all'
                                        }
                                        className="h-[42px] w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-40 lg:w-auto"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            <p className="mt-4 text-sm font-semibold text-slate-500">
                                {filteredOrders.length} pesanan ditampilkan
                            </p>
                        </section>

                        {filteredOrders.length === 0 ? (
                            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                                <div className="text-5xl">🔎</div>
                                <h2 className="mt-5 text-xl font-black text-slate-900">
                                    Pesanan tidak ditemukan
                                </h2>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white"
                                >
                                    Reset Filter
                                </button>
                            </section>
                        ) : (
                            <div className="space-y-5">
                                {filteredOrders.map((vendorOrder) => {
                                    const deliveryStatus =
                                        getDeliveryStatus(
                                            vendorOrder.delivery_status,
                                        );
                                    const paymentStatus =
                                        getPaymentStatus(
                                            vendorOrder.payment_status,
                                        );
                                    const items = Array.isArray(
                                        vendorOrder.items,
                                    )
                                        ? vendorOrder.items
                                        : [];
                                    const nextStatus =
                                        NEXT_STATUS[
                                        vendorOrder.delivery_status
                                        ];

                                    return (
                                        <article
                                            key={vendorOrder.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                        >
                                            <header className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div>
                                                        <h2 className="text-lg font-black text-slate-900">
                                                            Pesanan #
                                                            {
                                                                vendorOrder.order_id
                                                            }
                                                        </h2>
                                                        <p className="mt-1 text-sm font-bold text-slate-600">
                                                            {vendorOrder.vendor
                                                                ?.shop_name ??
                                                                'Vendor'}
                                                        </p>
                                                        <p className="mt-1 text-xs font-semibold text-slate-400">
                                                            {formatDate(
                                                                vendorOrder.created_at,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-black ${deliveryStatus.className}`}
                                                        >
                                                            {
                                                                deliveryStatus.label
                                                            }
                                                        </span>
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatus.className}`}
                                                        >
                                                            {
                                                                paymentStatus.label
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <Timeline
                                                    status={
                                                        vendorOrder.delivery_status
                                                    }
                                                />
                                            </header>

                                            <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                                                <aside className="h-fit rounded-2xl bg-slate-50 p-4">
                                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                                        Customer
                                                    </p>
                                                    <p className="mt-2 font-black text-slate-900">
                                                        {vendorOrder.customer
                                                            ?.name ??
                                                            'Customer'}
                                                    </p>
                                                    <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                                                        {vendorOrder.customer
                                                            ?.email ?? '-'}
                                                    </p>
                                                </aside>

                                                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                                                    {items.map((item) => (
                                                        <OrderItem
                                                            key={item.id}
                                                            item={item}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <footer className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                                    <OrderTotals
                                                        vendorOrder={
                                                            vendorOrder
                                                        }
                                                    />

                                                    {nextStatus && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateStatus(
                                                                    vendorOrder,
                                                                )
                                                            }
                                                            disabled={
                                                                processingOrderId ===
                                                                vendorOrder.id
                                                            }
                                                            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                                                        >
                                                            {processingOrderId ===
                                                                vendorOrder.id
                                                                ? 'Memperbarui...'
                                                                : NEXT_ACTION[
                                                                nextStatus
                                                                ]}
                                                        </button>
                                                    )}
                                                </div>
                                            </footer>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {Array.isArray(vendorOrders?.links) &&
                            vendorOrders.links.length > 3 && (
                                <nav className="flex flex-wrap justify-center gap-2">
                                    {vendorOrders.links.map((link, index) => (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url ?? '#'}
                                            preserveScroll
                                            className={`rounded-xl px-3 py-2 text-sm font-black ${link.active
                                                    ? 'bg-indigo-600 text-white'
                                                    : link.url
                                                        ? 'border border-slate-200 bg-white text-slate-700'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </nav>
                            )}
                    </>
                ) : (
                    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="text-6xl">📦</div>
                        <h2 className="mt-5 text-2xl font-black text-slate-900">
                            Belum ada pesanan
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Pesanan customer yang sudah dibayar akan muncul di
                            halaman ini.
                        </p>
                    </section>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function Stat({ label, value }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 truncate text-2xl font-black text-slate-900">
                {value}
            </p>
        </article>
    );
}

function OrderItem({ item }) {
    const hasDiscount = Boolean(item.has_discount);
    const promoText = promotionLabel(item.promotion);

    return (
        <div className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-900">
                            {item.product_name}
                        </p>
                        {hasDiscount && promoText && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                {promoText}
                            </span>
                        )}
                    </div>

                    <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                        SKU {item.sku}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-500">
                            {item.quantity} ×
                        </span>
                        {hasDiscount && (
                            <span className="text-slate-400 line-through">
                                {formatCurrency(item.original_price)}
                            </span>
                        )}
                        <span
                            className={`font-black ${hasDiscount
                                    ? 'text-red-600'
                                    : 'text-emerald-700'
                                }`}
                        >
                            {formatCurrency(
                                item.final_price ?? item.price,
                            )}
                        </span>
                    </div>

                    {hasDiscount && (
                        <p className="mt-2 text-xs font-black text-emerald-600">
                            Potongan total{' '}
                            {formatCurrency(item.discount_total)}
                        </p>
                    )}
                </div>

                <div className="sm:text-right">
                    {hasDiscount && (
                        <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(item.original_total)}
                        </p>
                    )}
                    <p className="mt-1 text-lg font-black text-slate-900">
                        {formatCurrency(
                            item.final_total ??
                            Number(item.price) * Number(item.quantity),
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

function OrderTotals({ vendorOrder }) {
    return (
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm">
            <div className="space-y-3 text-sm">
                {vendorOrder.has_discount && (
                    <>
                        <Row
                            label="Harga produk awal"
                            value={formatCurrency(
                                vendorOrder.original_subtotal,
                            )}
                        />
                        <Row
                            label="Diskon promo"
                            value={`-${formatCurrency(
                                vendorOrder.discount_total,
                            )}`}
                            className="text-red-600"
                        />
                    </>
                )}
                <Row
                    label="Pendapatan produk"
                    value={formatCurrency(vendorOrder.subtotal)}
                />
                <Row
                    label="Pengiriman"
                    value={formatCurrency(vendorOrder.shipping_cost)}
                />
                <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="font-black text-slate-900">
                        Total pesanan
                    </span>
                    <span className="text-lg font-black text-emerald-700">
                        {formatCurrency(
                            vendorOrder.total ??
                            Number(vendorOrder.subtotal) +
                            Number(vendorOrder.shipping_cost),
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, className = 'text-slate-900' }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-500">{label}</span>
            <span className={`font-black ${className}`}>{value}</span>
        </div>
    );
}

function Timeline({ status }) {
    const steps = [
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'completed',
    ];
    const index = steps.indexOf(status);
    const cancelled = status === 'cancelled';

    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-[620px] items-center">
                {steps.map((step, stepIndex) => {
                    const reached = !cancelled && index >= stepIndex;

                    return (
                        <div
                            key={step}
                            className="flex flex-1 items-center"
                        >
                            <div className="flex flex-col items-center">
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black ${reached
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : cancelled
                                                ? 'border-red-200 bg-red-50 text-red-500'
                                                : 'border-slate-300 bg-white text-slate-400'
                                        }`}
                                >
                                    {stepIndex + 1}
                                </span>
                                <span className="mt-1 text-[10px] font-bold text-slate-500">
                                    {getDeliveryStatus(step).shortLabel}
                                </span>
                            </div>

                            {stepIndex < steps.length - 1 && (
                                <span
                                    className={`mx-2 h-0.5 flex-1 ${!cancelled && index > stepIndex
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-200'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getDeliveryStatus(status) {
    const map = {
        pending: [
            'Menunggu Pembayaran',
            'Menunggu',
            'bg-amber-100 text-amber-700',
        ],
        confirmed: [
            'Dikonfirmasi',
            'Konfirmasi',
            'bg-blue-100 text-blue-700',
        ],
        processing: [
            'Diproses',
            'Proses',
            'bg-indigo-100 text-indigo-700',
        ],
        packed: ['Dikemas', 'Dikemas', 'bg-violet-100 text-violet-700'],
        shipped: ['Dikirim', 'Dikirim', 'bg-cyan-100 text-cyan-700'],
        completed: [
            'Selesai',
            'Selesai',
            'bg-emerald-100 text-emerald-700',
        ],
        cancelled: [
            'Dibatalkan',
            'Batal',
            'bg-red-100 text-red-700',
        ],
    };

    const selected = map[status] ?? [
        status ?? '-',
        status ?? '-',
        'bg-slate-100 text-slate-700',
    ];

    return {
        label: selected[0],
        shortLabel: selected[1],
        className: selected[2],
    };
}

function getPaymentStatus(status) {
    const map = {
        unpaid: ['Belum Dibayar', 'bg-amber-100 text-amber-700'],
        pending: ['Menunggu Konfirmasi', 'bg-blue-100 text-blue-700'],
        paid: ['Sudah Dibayar', 'bg-emerald-100 text-emerald-700'],
        failed: ['Pembayaran Gagal', 'bg-red-100 text-red-700'],
        expired: ['Kedaluwarsa', 'bg-slate-200 text-slate-700'],
        refunded: ['Dana Dikembalikan', 'bg-violet-100 text-violet-700'],
    };

    const selected = map[status] ?? [
        status ?? '-',
        'bg-slate-100 text-slate-700',
    ];

    return {
        label: selected[0],
        className: selected[1],
    };
}

function promotionLabel(promotion) {
    if (!promotion) return null;

    const value = Number(promotion.discount_value ?? 0);

    if (promotion.discount_type === 'percentage' && value > 0) {
        return `${value.toLocaleString('id-ID')}% OFF`;
    }

    if (promotion.discount_type === 'fixed' && value > 0) {
        return `Potongan ${formatCurrency(value)}`;
    }

    return promotion.name ?? 'Promo';
}

function formatCurrency(value) {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID', {
        maximumFractionDigits: 0,
    })}`;
}

function parseDateTime(value) {
    if (!value) return null;

    const normalized = String(value).trim();
    const local = normalized.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

    const parsed = local
        ? `${local[1]}-${local[2]}-${local[3]}T${local[4]}:${local[5]}:${local[6] ?? '00'}+08:00`
        : normalized;

    const timestamp = Date.parse(parsed);
    return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDate(value) {
    const timestamp = parseDateTime(value);
    if (timestamp === null) return '-';

    return `${new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(timestamp))} WITA`;
}