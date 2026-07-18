import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
} from '@inertiajs/react';
import { useState } from 'react';

const PAYMENT_STATUS = {
    unpaid: {
        label: 'Belum Dibayar',
        className: 'bg-amber-100 text-amber-700',
    },
    pending: {
        label: 'Menunggu Konfirmasi',
        className: 'bg-blue-100 text-blue-700',
    },
    paid: {
        label: 'Sudah Dibayar',
        className: 'bg-emerald-100 text-emerald-700',
    },
    failed: {
        label: 'Pembayaran Gagal',
        className: 'bg-red-100 text-red-700',
    },
    expired: {
        label: 'Kedaluwarsa',
        className: 'bg-slate-200 text-slate-700',
    },
    refunded: {
        label: 'Dana Dikembalikan',
        className: 'bg-violet-100 text-violet-700',
    },
};

export default function Index({
    orders = {},
    summary = {},
    filters = {},
}) {
    const [form, setForm] = useState({
        search: filters?.search ?? '',
        payment_status: filters?.payment_status ?? '',
        date_from: filters?.date_from ?? '',
        date_to: filters?.date_to ?? '',
    });

    const orderItems = Array.isArray(orders?.data) ? orders.data : [];

    const updateForm = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const submit = (event) => {
        event.preventDefault();

        router.get(
            route('admin.reports.transactions.index'),
            cleanFilters(form),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const reset = () => {
        const emptyFilters = {
            search: '',
            payment_status: '',
            date_from: '',
            date_to: '',
        };

        setForm(emptyFilters);

        router.get(
            route('admin.reports.transactions.index'),
            {},
            {
                replace: true,
            },
        );
    };

    const exportUrl = route().has('admin.reports.transactions.export')
        ? route(
              'admin.reports.transactions.export',
              cleanFilters(form),
          )
        : route('admin.reports.transactions.index', {
              ...cleanFilters(form),
              export: 'csv',
          });

    const cards = [
        {
            label: 'Jumlah Pesanan',
            value: formatNumber(summary.total_orders),
        },
        {
            label: 'Nilai Transaksi',
            value: formatCurrency(summary.total_transaction_value),
        },
        {
            label: 'Pesanan Dibayar',
            value: formatNumber(summary.paid_orders),
        },
        {
            label: 'Nilai Sudah Dibayar',
            value: formatCurrency(summary.paid_transaction_value),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Transaksi" />

            <div className="space-y-6">
                <PageHeader exportUrl={exportUrl} />

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                        <article
                            key={card.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                {card.label}
                            </p>
                            <p className="mt-3 break-words text-2xl font-black text-slate-900">
                                {card.value}
                            </p>
                        </article>
                    ))}
                </section>

                <FilterForm
                    form={form}
                    updateForm={updateForm}
                    onSubmit={submit}
                    onReset={reset}
                />

                {orderItems.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid gap-4 lg:hidden">
                            {orderItems.map((order) => (
                                <TransactionCard key={order.id} order={order} />
                            ))}
                        </div>

                        <TransactionTable orders={orderItems} />
                        <Pagination links={orders?.links ?? []} />
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({ exportUrl }) {
    return (
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Analitik admin
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Laporan Transaksi
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Pantau jumlah pesanan, pembayaran, dan nilai transaksi
                    berdasarkan periode yang dipilih.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <a
                    href={exportUrl}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                >
                    Ekspor CSV
                </a>

                <Link
                    href={route('admin.activity-logs.index')}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                    Audit Log
                </Link>
            </div>
        </section>
    );
}

function FilterForm({ form, updateForm, onSubmit, onReset }) {
    const hasFilter = Object.values(form).some((value) => String(value).trim());

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <form
                onSubmit={onSubmit}
                className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_180px_180px_auto]"
            >
                <FormField label="Cari Pesanan" htmlFor="report-search">
                    <input
                        id="report-search"
                        type="search"
                        value={form.search}
                        onChange={(event) =>
                            updateForm('search', event.target.value)
                        }
                        placeholder="ID atau referensi pembayaran..."
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                    />
                </FormField>

                <FormField label="Status Pembayaran" htmlFor="payment-status">
                    <select
                        id="payment-status"
                        value={form.payment_status}
                        onChange={(event) =>
                            updateForm('payment_status', event.target.value)
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                    >
                        <option value="">Semua Status</option>
                        {Object.entries(PAYMENT_STATUS).map(
                            ([value, status]) => (
                                <option key={value} value={value}>
                                    {status.label}
                                </option>
                            ),
                        )}
                    </select>
                </FormField>

                <FormField label="Tanggal Awal" htmlFor="date-from">
                    <input
                        id="date-from"
                        type="date"
                        value={form.date_from}
                        onChange={(event) =>
                            updateForm('date_from', event.target.value)
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                    />
                </FormField>

                <FormField label="Tanggal Akhir" htmlFor="date-to">
                    <input
                        id="date-to"
                        type="date"
                        value={form.date_to}
                        onChange={(event) =>
                            updateForm('date_to', event.target.value)
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                    />
                </FormField>

                <div className="flex items-end gap-2">
                    <button
                        type="submit"
                        className="h-[42px] flex-1 rounded-xl bg-violet-600 px-4 text-sm font-black text-white hover:bg-violet-700"
                    >
                        Terapkan
                    </button>
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={!hasFilter}
                        className="h-[42px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-40"
                    >
                        Reset
                    </button>
                </div>
            </form>
        </section>
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

function TransactionTable({ orders }) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <Heading>Pesanan</Heading>
                            <Heading>Referensi</Heading>
                            <Heading>Status</Heading>
                            <Heading right>Total</Heading>
                            <Heading>Dibuat</Heading>
                            <Heading>Dibayar</Heading>
                            <Heading right>Detail</Heading>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-black text-slate-900">
                                    #{order.id}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-600">
                                    {order.payment_reference ?? '-'}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4">
                                    <PaymentStatus status={order.payment_status} />
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black text-slate-900">
                                    {formatCurrency(order.grand_total)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">
                                    {formatDate(order.created_at)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">
                                    {formatDate(order.paid_at)}
                                </td>
                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                    <Link
                                        href={route('orders.show', order.id)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-sm font-black text-violet-700 hover:bg-violet-100"
                                        title="Lihat Pesanan"
                                        aria-label={`Lihat pesanan ${order.id}`}
                                    >
                                        →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function TransactionCard({ order }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4">
                <div>
                    <p className="font-black text-slate-900">Pesanan #{order.id}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                        {order.payment_reference ?? 'Tanpa referensi'}
                    </p>
                </div>
                <PaymentStatus status={order.payment_status} />
            </header>

            <div className="grid grid-cols-2 gap-4 p-4">
                <Info label="Total" value={formatCurrency(order.grand_total)} />
                <Info label="Dibuat" value={formatDate(order.created_at)} />
                <Info label="Dibayar" value={formatDate(order.paid_at)} />
            </div>

            <div className="border-t border-slate-100 p-3">
                <Link
                    href={route('orders.show', order.id)}
                    className="block w-full rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-black text-white hover:bg-violet-700"
                >
                    Lihat Detail
                </Link>
            </div>
        </article>
    );
}

function PaymentStatus({ status }) {
    const item = PAYMENT_STATUS[status] ?? {
        label: status ?? '-',
        className: 'bg-slate-100 text-slate-700',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${item.className}`}
        >
            {item.label}
        </span>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
        </div>
    );
}

function Heading({ children, right = false }) {
    return (
        <th
            className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
                right ? 'text-right' : 'text-left'
            }`}
        >
            {children}
        </th>
    );
}

function EmptyState() {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-6xl">📊</div>
            <h2 className="mt-5 text-2xl font-black text-slate-900">
                Data tidak ditemukan
            </h2>
            <p className="mt-2 text-sm text-slate-500">
                Tidak ada transaksi yang sesuai dengan filter yang digunakan.
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

function cleanFilters(values) {
    return Object.fromEntries(
        Object.entries(values).filter(([, value]) => String(value).trim() !== ''),
    );
}

function formatCurrency(value) {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID', {
        maximumFractionDigits: 0,
    })}`;
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString('id-ID');
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
