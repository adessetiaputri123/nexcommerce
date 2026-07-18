import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
} from '@inertiajs/react';

export default function Dashboard({
    stats = {},
    recentActivities = [],
    recentWithdrawals = [],
}) {
    const statisticCards = [
        {
            label: 'Total Pesanan',
            value: formatNumber(
                stats.total_orders,
            ),
            description:
                'Seluruh pesanan marketplace.',
            icon: 'orders',
            tone: 'indigo',
        },
        {
            label: 'Pesanan Dibayar',
            value: formatNumber(
                stats.paid_orders,
            ),
            description:
                'Pembayaran berhasil diterima.',
            icon: 'paid',
            tone: 'emerald',
        },
        {
            label: 'Total Transaksi',
            value: formatCurrency(
                stats.total_revenue,
            ),
            description:
                'Nilai transaksi berstatus dibayar.',
            icon: 'revenue',
            tone: 'blue',
        },
        {
            label: 'Jumlah Vendor',
            value: formatNumber(
                stats.total_vendors,
            ),
            description:
                'Vendor yang terdaftar.',
            icon: 'vendor',
            tone: 'violet',
        },
        {
            label: 'Saldo Vendor',
            value: formatCurrency(
                stats.total_vendor_balance,
            ),
            description:
                'Saldo gabungan semua vendor.',
            icon: 'wallet',
            tone: 'teal',
        },
        {
            label: 'Penarikan Menunggu',
            value: formatNumber(
                stats.pending_withdrawals,
            ),
            description: formatCurrency(
                stats.pending_withdrawal_amount,
            ),
            icon: 'withdrawal',
            tone: 'amber',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Admin" />

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                            Pusat administrasi
                        </p>

                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            Ringkasan Marketplace
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                            Pantau transaksi, vendor, aktivitas sistem, dan pencairan saldo dalam satu tempat.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction
                            label="Buat Promo"
                            icon="discount"
                            routeNames={[
                                'admin.promotions.create',
                                'admin.promotions.index',
                            ]}
                        />

                        <QuickAction
                            label="Penarikan"
                            icon="withdrawal"
                            routeNames={[
                                'admin.withdrawals.index',
                            ]}
                        />

                        <QuickAction
                            label="Audit Log"
                            icon="activity"
                            routeNames={[
                                'admin.activity-logs.index',
                            ]}
                        />

                        <QuickAction
                            label="Laporan"
                            icon="report"
                            routeNames={[
                                'admin.reports.transactions.index',
                            ]}
                        />
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                        Statistik utama
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                        Kondisi marketplace saat ini
                    </h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {statisticCards.map(
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
                    label="Belum Dibayar"
                    value={formatNumber(
                        stats.unpaid_orders,
                    )}
                    tone="amber"
                />

                <StatusCard
                    label="Sudah Dibayar"
                    value={formatNumber(
                        stats.paid_orders,
                    )}
                    tone="emerald"
                />

                <StatusCard
                    label="Kedaluwarsa"
                    value={formatNumber(
                        stats.expired_orders,
                    )}
                    tone="slate"
                />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-2">
                <DataSection
                    title="Aktivitas Terbaru"
                    description="Aktivitas penting sistem terbaru."
                    routeNames={[
                        'admin.activity-logs.index',
                    ]}
                    emptyText="Belum ada aktivitas."
                >
                    {recentActivities.map(
                        (activity) => (
                            <ActivityItem
                                key={
                                    activity.id
                                }
                                activity={
                                    activity
                                }
                            />
                        ),
                    )}
                </DataSection>

                <DataSection
                    title="Penarikan Terbaru"
                    description="Pengajuan pencairan saldo vendor."
                    routeNames={[
                        'admin.withdrawals.index',
                    ]}
                    emptyText="Belum ada pengajuan."
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
        toneClasses.indigo;

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
        amber:
            'border-amber-200 bg-amber-50 text-amber-800',
        emerald:
            'border-emerald-200 bg-emerald-50 text-emerald-800',
        slate:
            'border-slate-200 bg-slate-100 text-slate-800',
    };

    return (
        <article className={`rounded-2xl border p-5 ${styles[tone]}`}>
            <p className="text-sm font-black">
                {label}
            </p>

            <p className="mt-2 text-3xl font-black">
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
                        className="shrink-0 text-sm font-black text-violet-700 hover:text-violet-800"
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

function ActivityItem({
    activity,
}) {
    const actionData =
        getActionData(
            activity.action,
        );

    return (
        <article className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${actionData.className}`}>
                    {
                        actionData.label
                    }
                </span>

                <span className="text-xs font-semibold text-slate-400">
                    {formatDate(
                        activity.created_at,
                    )}
                </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
                {activity.description ??
                    '-'}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span>
                    Aktor:{' '}
                    {activity.actor
                        ?.name ??
                        'Sistem'}
                </span>

                {activity.vendor && (
                    <span>
                        Vendor:{' '}
                        {
                            activity.vendor.shop_name
                        }
                    </span>
                )}
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
                            withdrawal.vendor
                                ?.shop_name ??
                            '-'
                        }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {withdrawal.requester
                            ?.name ??
                            '-'}{' '}
                        ·{' '}
                        {withdrawal.bank_name ??
                            '-'}
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

function getActionData(
    action,
) {
    const items = {
        'payment.completed': {
            label:
                'Pembayaran Berhasil',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        'vendor_order.status_changed': {
            label:
                'Status Pesanan Berubah',
            className:
                'bg-blue-100 text-blue-700',
        },
        'withdrawal.requested': {
            label:
                'Penarikan Diajukan',
            className:
                'bg-amber-100 text-amber-700',
        },
        'withdrawal.approved': {
            label:
                'Penarikan Disetujui',
            className:
                'bg-indigo-100 text-indigo-700',
        },
        'withdrawal.rejected': {
            label:
                'Penarikan Ditolak',
            className:
                'bg-red-100 text-red-700',
        },
        'withdrawal.paid': {
            label:
                'Penarikan Dibayar',
            className:
                'bg-teal-100 text-teal-700',
        },
    };

    return items[action] ?? {
        label:
            action ??
            'Aktivitas',
        className:
            'bg-slate-100 text-slate-700',
    };
}

function getWithdrawalStatus(
    status,
) {
    const items = {
        pending: {
            label:
                'Menunggu',
            className:
                'bg-amber-100 text-amber-700',
        },
        approved: {
            label:
                'Disetujui',
            className:
                'bg-blue-100 text-blue-700',
        },
        rejected: {
            label:
                'Ditolak',
            className:
                'bg-red-100 text-red-700',
        },
        paid: {
            label:
                'Sudah Dibayar',
            className:
                'bg-emerald-100 text-emerald-700',
        },
    };

    return items[status] ?? {
        label:
            status ??
            '-',
        className:
            'bg-slate-100 text-slate-700',
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
    blue:
        'bg-blue-100 text-blue-700',
    violet:
        'bg-violet-100 text-violet-700',
    teal:
        'bg-teal-100 text-teal-700',
    amber:
        'bg-amber-100 text-amber-700',
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
                <path d="M9 15h6" />
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
        revenue: (
            <>
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19H2" />
            </>
        ),
        vendor: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v10h14V10" />
                <path d="M3 10l2-6h14l2 6" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6Z" />
                <path d="M4 6V4h12" />
                <path d="M16 11h4" />
            </>
        ),
        withdrawal: (
            <>
                <path d="M12 3v12" />
                <path d="m8 11 4 4 4-4" />
                <path d="M5 21h14" />
            </>
        ),
        discount: (
            <>
                <path d="M20 12 12 20 4 12l8-8 8 8Z" />
                <path d="m9 15 6-6" />
            </>
        ),
        activity: (
            <path d="M3 12h4l2-6 4 12 2-6h6" />
        ),
        report: (
            <>
                <path d="M5 3h10l4 4v14H5V3Z" />
                <path d="M15 3v5h5" />
                <path d="M9 17v-4" />
                <path d="M13 17V9" />
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