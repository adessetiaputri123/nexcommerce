import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import { useMemo, useState } from 'react';

const ACTION_LABELS = {
    'payment.completed': 'Pembayaran Berhasil',
    'vendor_order.status_changed': 'Status Pesanan Berubah',
    'withdrawal.requested': 'Penarikan Diajukan',
    'withdrawal.approved': 'Penarikan Disetujui',
    'withdrawal.rejected': 'Penarikan Ditolak',
    'withdrawal.paid': 'Penarikan Dibayar',
};

const ACTION_CLASSES = {
    'payment.completed': 'bg-emerald-100 text-emerald-700',
    'vendor_order.status_changed': 'bg-blue-100 text-blue-700',
    'withdrawal.requested': 'bg-amber-100 text-amber-700',
    'withdrawal.approved': 'bg-indigo-100 text-indigo-700',
    'withdrawal.rejected': 'bg-red-100 text-red-700',
    'withdrawal.paid': 'bg-teal-100 text-teal-700',
};

export default function Index({
    logs = {},
    actions = [],
    filters = {},
}) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters?.search ?? '');
    const [action, setAction] = useState(filters?.action ?? '');

    const logItems = Array.isArray(logs?.data) ? logs.data : [];

    const visibleActors = useMemo(() => {
        return new Set(
            logItems
                .map((log) => log.actor?.id ?? log.actor?.email)
                .filter(Boolean),
        ).size;
    }, [logItems]);

    const visibleVendors = useMemo(() => {
        return new Set(
            logItems
                .map((log) => log.vendor?.id ?? log.vendor?.shop_name)
                .filter(Boolean),
        ).size;
    }, [logItems]);

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            route('admin.activity-logs.index'),
            {
                search: search.trim() || undefined,
                action: action || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setAction('');

        router.get(
            route('admin.activity-logs.index'),
            {},
            {
                preserveState: false,
                replace: true,
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Audit Log" />

            <div className="space-y-6">
                <PageHeader />

                {flash?.message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatisticCard
                        label="Total Log"
                        value={logs?.total ?? logItems.length}
                    />
                    <StatisticCard
                        label="Ditampilkan"
                        value={logItems.length}
                    />
                    <StatisticCard
                        label="Aktor Halaman Ini"
                        value={visibleActors}
                    />
                    <StatisticCard
                        label="Vendor Halaman Ini"
                        value={visibleVendors}
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <form
                        onSubmit={applyFilters}
                        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px_auto_auto]"
                    >
                        <FormField label="Cari Aktivitas" htmlFor="activity-search">
                            <input
                                id="activity-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Aktor, vendor, subjek, atau deskripsi..."
                                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                            />
                        </FormField>

                        <FormField label="Jenis Aktivitas" htmlFor="action-filter">
                            <select
                                id="action-filter"
                                value={action}
                                onChange={(event) => setAction(event.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                            >
                                <option value="">Semua Aktivitas</option>
                                {actions.map((item) => (
                                    <option key={item} value={item}>
                                        {ACTION_LABELS[item] ?? item}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="h-[42px] w-full rounded-xl bg-violet-600 px-5 text-sm font-black text-white transition hover:bg-violet-700"
                            >
                                Terapkan
                            </button>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!search && !action}
                                className="h-[42px] w-full rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                {logItems.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid gap-4 lg:hidden">
                            {logItems.map((log) => (
                                <ActivityCard key={log.id} log={log} />
                            ))}
                        </div>

                        <ActivityTable logs={logItems} />
                        <Pagination links={logs?.links ?? []} />
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader() {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Keamanan dan kepatuhan
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Audit Log
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Tinjau aktivitas penting sistem, pembayaran, perubahan pesanan,
                    dan proses penarikan vendor.
                </p>
            </div>

            <Link
                href={route('admin.withdrawals.index')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
                Kelola Penarikan
            </Link>
        </section>
    );
}

function StatisticCard({ label, value }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </article>
    );
}

function FormField({ label, htmlFor, children }) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

function ActivityTable({ logs }) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <Heading>Waktu</Heading>
                            <Heading>Aktivitas</Heading>
                            <Heading>Aktor</Heading>
                            <Heading>Vendor</Heading>
                            <Heading>Subjek</Heading>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="align-top hover:bg-slate-50">
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">
                                    {formatDate(log.created_at)}
                                </td>
                                <td className="px-5 py-4">
                                    <ActionBadge action={log.action} />
                                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-700">
                                        {log.description ?? '-'}
                                    </p>
                                    <PropertiesDetails properties={log.properties} />
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-sm font-black text-slate-900">
                                        {log.actor?.name ?? 'Sistem'}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {log.actor?.email ?? '-'}
                                    </p>
                                    {log.ip_address && (
                                        <p className="mt-1 font-mono text-xs text-slate-400">
                                            {log.ip_address}
                                        </p>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                    {log.vendor?.shop_name ?? '-'}
                                </td>
                                <td className="px-5 py-4">
                                    <p className="text-sm font-black text-slate-900">
                                        {log.subject_label ?? '-'}
                                    </p>
                                    {log.subject_id && (
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            ID #{log.subject_id}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ActivityCard({ log }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <ActionBadge action={log.action} />
                <span className="text-xs font-semibold text-slate-400">
                    {formatDate(log.created_at)}
                </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">
                {log.description ?? '-'}
            </p>

            <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
                <Info label="Aktor" value={log.actor?.name ?? 'Sistem'} />
                <Info label="Vendor" value={log.vendor?.shop_name ?? '-'} />
                <Info label="Subjek" value={log.subject_label ?? '-'} />
            </div>

            {log.actor?.email && (
                <p className="mt-3 break-all text-xs font-semibold text-slate-500">
                    {log.actor.email}
                </p>
            )}

            <PropertiesDetails properties={log.properties} />
        </article>
    );
}

function ActionBadge({ action }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                ACTION_CLASSES[action] ?? 'bg-slate-100 text-slate-700'
            }`}
        >
            {ACTION_LABELS[action] ?? action}
        </span>
    );
}

function PropertiesDetails({ properties }) {
    const hasProperties = Object.keys(properties ?? {}).length > 0;

    if (!hasProperties) return null;

    return (
        <details className="mt-3">
            <summary className="cursor-pointer text-xs font-black text-violet-600">
                Lihat detail teknis
            </summary>
            <pre className="mt-2 max-w-full overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {JSON.stringify(properties, null, 2)}
            </pre>
        </details>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-black text-slate-800">
                {value}
            </p>
        </div>
    );
}

function Heading({ children }) {
    return (
        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
            {children}
        </th>
    );
}

function EmptyState() {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-6xl">🛡️</div>
            <h2 className="mt-5 text-2xl font-black text-slate-900">
                Aktivitas tidak ditemukan
            </h2>
            <p className="mt-2 text-sm text-slate-500">
                Belum ada log atau tidak ada aktivitas yang sesuai dengan filter.
            </p>
        </section>
    );
}

function Pagination({ links = [] }) {
    if (links.length <= 3) return null;

    return (
        <nav className="flex flex-wrap justify-center gap-2">
            {links.map((link, index) => (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url ?? '#'}
                    preserveScroll
                    preserveState
                    className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition ${
                        link.active
                            ? 'bg-violet-600 text-white'
                            : link.url
                              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              : 'cursor-not-allowed bg-slate-100 text-slate-400'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
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
