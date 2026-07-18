import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
} from '@inertiajs/react';

export default function Dashboard({
    vendor,
    stats = {},
    recentOrders = [],
    recentWithdrawals = [],
}) {
    const cards = [
        {
            label: 'Total Pesanan',
            value: formatNumber(
                stats.total_orders,
            ),
            description:
                'Seluruh pesanan yang masuk.',
            icon: 'orders',
            tone: 'indigo',
        },
        {
            label: 'Pesanan Dibayar',
            value: formatNumber(
                stats.paid_orders,
            ),
            description:
                'Pembayaran yang berhasil.',
            icon: 'paid',
            tone: 'emerald',
        },
        {
            label: 'Sedang Diproses',
            value: formatNumber(
                stats.processing_orders,
            ),
            description:
                'Pesanan aktif yang perlu ditangani.',
            icon: 'processing',
            tone: 'amber',
        },
        {
            label: 'Pesanan Selesai',
            value: formatNumber(
                stats.completed_orders,
            ),
            description:
                'Pesanan yang sudah selesai.',
            icon: 'completed',
            tone: 'teal',
        },
        {
            label: 'Nilai Penjualan',
            value: formatCurrency(
                stats.gross_sales,
            ),
            description:
                'Nilai pesanan berstatus dibayar.',
            icon: 'sales',
            tone: 'blue',
        },
        {
            label: 'Saldo Wallet',
            value: formatCurrency(
                stats.wallet_balance,
            ),
            description:
                'Saldo yang tersedia untuk dicairkan.',
            icon: 'wallet',
            tone: 'violet',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Vendor" />

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                            Dashboard vendor
                        </p>

                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {vendor?.shop_name ??
                                'Toko Anda'}
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
                            Pantau pesanan, penjualan, saldo, dan pencairan toko melalui satu halaman.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction
                            label="Pesanan"
                            icon="orders"
                            routeNames={[
                                'vendor.orders.index',
                            ]}
                        />

                        <QuickAction
                            label="Produk"
                            icon="products"
                            routeNames={[
                                'vendor.products.index',
                            ]}
                        />

                        <QuickAction
                            label="Wallet"
                            icon="wallet"
                            routeNames={[
                                'vendor.wallet.index',
                            ]}
                        />

                        <QuickAction
                            label="Katalog"
                            icon="store"
                            routeNames={[
                                'catalog',
                            ]}
                        />
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                        Performa toko
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                        Ringkasan operasional
                    </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map(
                        (card) => (
                            <StatisticCard
                                key={
                                    card.label
                                }
                                card={card}
                            />
                        ),
                    )}
                </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatusCard
                    label="Penjualan Selesai"
                    value={formatCurrency(
                        stats.completed_sales,
                    )}
                    tone="emerald"
                />

                <StatusCard
                    label="Penarikan Menunggu"
                    value={formatNumber(
                        stats.pending_withdrawals,
                    )}
                    tone="amber"
                />

                <StatusCard
                    label="Nominal Menunggu"
                    value={formatCurrency(
                        stats.pending_withdrawal_amount,
                    )}
                    tone="violet"
                />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-2">
                <DataSection
                    title="Pesanan Terbaru"
                    description="Pesanan terbaru yang masuk ke toko."
                    routeNames={[
                        'vendor.orders.index',
                    ]}
                    emptyText="Belum ada pesanan."
                >
                    {recentOrders.map(
                        (order) => (
                            <OrderItem
                                key={
                                    order.id
                                }
                                order={order}
                            />
                        ),
                    )}
                </DataSection>

                <DataSection
                    title="Penarikan Terbaru"
                    description="Riwayat pencairan saldo vendor."
                    routeNames={[
                        'vendor.wallet.index',
                    ]}
                    emptyText="Belum ada pengajuan penarikan."
                >
                    {recentWithdrawals.map(
                        (withdrawal) => (
                            <WithdrawalItem
                                key={
                                    withdrawal.id
                                }
                                withdrawal={
                                    withdrawal
                                }
                            />
                        ),
                    )}
                </DataSection>
            </section>
        </AuthenticatedLayout>
    );
}

function StatisticCard({
    card,
}) {
    const tone =
        toneClasses[
        card.tone
        ] ??
        toneClasses.emerald;

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-500">
                        {
                            card.label
                        }
                    </p>

                    <p className="mt-3 break-words text-2xl font-black text-slate-900">
                        {
                            card.value
                        }
                    </p>
                </div>

                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                    <Icon
                        name={
                            card.icon
                        }
                        className="h-6 w-6"
                    />
                </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
                {
                    card.description
                }
            </p>
        </article>
    );
}

function StatusCard({
    label,
    value,
    tone,
}) {
    const styles = {
        emerald:
            'border-emerald-200 bg-emerald-50 text-emerald-800',
        amber:
            'border-amber-200 bg-amber-50 text-amber-800',
        violet:
            'border-violet-200 bg-violet-50 text-violet-800',
    };

    return (
        <article className={`rounded-2xl border p-5 ${styles[tone]}`}>
            <p className="text-sm font-black">
                {label}
            </p>

            <p className="mt-2 break-words text-2xl font-black">
                {value}
            </p>
        </article>
    );
}

function QuickAction({
    label,
    icon,
    routeNames,
}) {
    const href =
        resolveRoute(
            routeNames,
        );

    if (!href) {
        return null;
    }

    return (
        <Link
            href={href}
            className="flex min-w-[130px] items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/25"
        >
            <Icon
                name={icon}
                className="h-5 w-5"
            />

            {label}
        </Link>
    );
}

function DataSection({
    title,
    description,
    routeNames,
    emptyText,
    children,
}) {
    const items =
        Array.isArray(children)
            ? children.filter(Boolean)
            : children
                ? [children]
                : [];

    const href =
        resolveRoute(
            routeNames,
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                    <h2 className="font-black text-slate-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {
                            description
                        }
                    </p>
                </div>

                {href && (
                    <Link
                        href={href}
                        className="shrink-0 text-sm font-black text-emerald-700 hover:text-emerald-800"
                    >
                        Lihat semua
                    </Link>
                )}
            </div>

            {items.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                    {emptyText}
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {items}
                </div>
            )}
        </section>
    );
}

function OrderItem({
    order,
}) {
    const orderStatus =
        getOrderStatus(
            order.status,
        );

    const paymentStatus =
        getPaymentStatus(
            order.payment_status,
        );

    return (
        <article className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-black text-slate-900">
                        Pesanan #
                        {
                            order.order_id
                        }
                    </p>

                    <p className="mt-1 font-mono text-xs text-slate-500">
                        {order.payment_reference ??
                            '-'}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        {formatDate(
                            order.created_at,
                        )}
                    </p>
                </div>

                <div className="sm:text-right">
                    <p className="font-black text-slate-900">
                        {formatCurrency(
                            order.subtotal,
                        )}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${orderStatus.className}`}>
                            {
                                orderStatus.label
                            }
                        </span>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${paymentStatus.className}`}>
                            {
                                paymentStatus.label
                            }
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

function WithdrawalItem({
    withdrawal,
}) {
    const status =
        getWithdrawalStatus(
            withdrawal.status,
        );

    return (
        <article className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-black text-slate-900">
                        {
                            withdrawal.request_code
                        }
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                        {
                            withdrawal.bank_name ??
                            '-'
                        }
                    </p>

                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        {formatDate(
                            withdrawal.created_at,
                        )}
                    </p>
                </div>

                <div className="sm:text-right">
                    <p className="font-black text-slate-900">
                        {formatCurrency(
                            withdrawal.amount,
                        )}
                    </p>

                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}>
                        {
                            status.label
                        }
                    </span>
                </div>
            </div>
        </article>
    );
}

function getOrderStatus(
    status,
) {
    const items = {
        pending: [
            'Menunggu',
            'bg-amber-100 text-amber-700',
        ],
        confirmed: [
            'Dikonfirmasi',
            'bg-blue-100 text-blue-700',
        ],
        processing: [
            'Diproses',
            'bg-indigo-100 text-indigo-700',
        ],
        packed: [
            'Dikemas',
            'bg-violet-100 text-violet-700',
        ],
        shipped: [
            'Dikirim',
            'bg-cyan-100 text-cyan-700',
        ],
        completed: [
            'Selesai',
            'bg-emerald-100 text-emerald-700',
        ],
        cancelled: [
            'Dibatalkan',
            'bg-red-100 text-red-700',
        ],
        expired: [
            'Kedaluwarsa',
            'bg-slate-200 text-slate-700',
        ],
    };

    const item =
        items[status] ?? [
            status ?? '-',
            'bg-slate-100 text-slate-700',
        ];

    return {
        label:
            item[0],
        className:
            item[1],
    };
}

function getPaymentStatus(
    status,
) {
    const items = {
        unpaid: [
            'Belum Dibayar',
            'bg-amber-100 text-amber-700',
        ],
        paid: [
            'Sudah Dibayar',
            'bg-emerald-100 text-emerald-700',
        ],
        expired: [
            'Kedaluwarsa',
            'bg-slate-100 text-slate-700',
        ],
    };

    const item =
        items[status] ?? [
            status ?? '-',
            'bg-slate-100 text-slate-700',
        ];

    return {
        label:
            item[0],
        className:
            item[1],
    };
}

function getWithdrawalStatus(
    status,
) {
    const items = {
        pending: [
            'Menunggu',
            'bg-amber-100 text-amber-700',
        ],
        approved: [
            'Disetujui',
            'bg-blue-100 text-blue-700',
        ],
        rejected: [
            'Ditolak',
            'bg-red-100 text-red-700',
        ],
        paid: [
            'Sudah Dibayar',
            'bg-emerald-100 text-emerald-700',
        ],
    };

    const item =
        items[status] ?? [
            status ?? '-',
            'bg-slate-100 text-slate-700',
        ];

    return {
        label:
            item[0],
        className:
            item[1],
    };
}

function resolveRoute(
    routeNames,
) {
    const routeName =
        routeNames.find(
            (name) =>
                route().has(
                    name,
                ),
        );

    return routeName
        ? route(
            routeName,
        )
        : null;
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
        )
        : '0'}`;
}

function formatNumber(
    value,
) {
    const number =
        Number(
            value ?? 0,
        );

    return Number.isFinite(
        number,
    )
        ? number.toLocaleString(
            'id-ID',
        )
        : '0';
}

function parseDateTime(
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

    return Number.isNaN(timestamp)
        ? null
        : timestamp;
}

function formatDate(
    value,
) {
    const timestamp =
        parseDateTime(value);

    if (timestamp === null) {
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
    ).format(new Date(timestamp))} WITA`;
}

const toneClasses = {
    indigo:
        'bg-indigo-100 text-indigo-700',
    emerald:
        'bg-emerald-100 text-emerald-700',
    amber:
        'bg-amber-100 text-amber-700',
    teal:
        'bg-teal-100 text-teal-700',
    blue:
        'bg-blue-100 text-blue-700',
    violet:
        'bg-violet-100 text-violet-700',
};

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
        orders: (
            <>
                <path d="M7 3h10l2 3v15H5V6l2-3Z" />
                <path d="M5 7h14" />
                <path d="M9 11h6" />
            </>
        ),
        paid: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="m8 12 2.5 2.5L16 9" />
            </>
        ),
        processing: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="M12 7v5l3 2" />
            </>
        ),
        completed: (
            <>
                <path d="M4 12 9 17 20 6" />
            </>
        ),
        sales: (
            <>
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19H2" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6Z" />
                <path d="M4 6V4h12" />
                <path d="M16 11h4" />
            </>
        ),
        products: (
            <>
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4.5 7.8 7.5 4.2 7.5-4.2" />
            </>
        ),
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
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