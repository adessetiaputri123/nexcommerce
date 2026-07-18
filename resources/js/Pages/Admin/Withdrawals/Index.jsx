import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS_OPTIONS = [
    ['', 'Semua'],
    ['pending', 'Menunggu'],
    ['approved', 'Disetujui'],
    ['rejected', 'Ditolak'],
    ['paid', 'Sudah Dibayar'],
];

const STATUS_LABELS = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    paid: 'Sudah Dibayar',
};

const STATUS_CLASSES = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-emerald-100 text-emerald-700',
};

export default function Index({
    withdrawals = {},
    filters = {},
}) {
    const { flash, errors } = usePage().props;
    const [processingId, setProcessingId] = useState(null);

    const withdrawalItems = Array.isArray(withdrawals?.data)
        ? withdrawals.data
        : [];

    const pageSummary = useMemo(() => {
        return withdrawalItems.reduce(
            (result, withdrawal) => {
                result.amount += Number(withdrawal.amount ?? 0);
                result[withdrawal.status] =
                    Number(result[withdrawal.status] ?? 0) + 1;
                return result;
            },
            {
                amount: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                paid: 0,
            },
        );
    }, [withdrawalItems]);

    const processWithdrawal = (withdrawal, action) => {
        let reviewNote = null;

        if (action === 'reject') {
            reviewNote = window.prompt('Masukkan alasan penolakan:');

            if (reviewNote === null || reviewNote.trim() === '') {
                return;
            }
        }

        const messages = {
            approve: 'Setujui pengajuan penarikan ini?',
            reject: 'Tolak pengajuan dan kembalikan saldo vendor?',
            paid: 'Tandai penarikan sebagai sudah dibayar?',
        };

        if (!window.confirm(messages[action])) return;

        router.patch(
            route('admin.withdrawals.update', withdrawal.id),
            {
                action,
                review_note: reviewNote,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessingId(withdrawal.id),
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const changeStatus = (status) => {
        router.get(
            route('admin.withdrawals.index'),
            {
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Permintaan Penarikan" />

            <div className="space-y-6">
                <PageHeader />

                {flash?.message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(errors?.action || errors?.review_note || errors?.error) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {errors.action ??
                            errors.review_note ??
                            errors.error}
                    </div>
                )}

                <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatisticCard
                        label="Total Filter"
                        value={withdrawals?.total ?? withdrawalItems.length}
                    />
                    <StatisticCard
                        label="Menunggu di Halaman"
                        value={pageSummary.pending}
                        valueClassName="text-amber-600"
                    />
                    <StatisticCard
                        label="Disetujui di Halaman"
                        value={pageSummary.approved}
                        valueClassName="text-blue-600"
                    />
                    <StatisticCard
                        label="Sudah Dibayar"
                        value={pageSummary.paid}
                        valueClassName="text-emerald-600"
                    />
                    <StatisticCard
                        label="Nominal Halaman Ini"
                        value={formatCurrency(pageSummary.amount)}
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Filter Status
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => changeStatus(value)}
                                className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                                    (filters?.status ?? '') === value
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {withdrawalItems.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid gap-4 lg:hidden">
                            {withdrawalItems.map((withdrawal) => (
                                <WithdrawalCard
                                    key={withdrawal.id}
                                    withdrawal={withdrawal}
                                    processing={
                                        processingId === withdrawal.id
                                    }
                                    onProcess={processWithdrawal}
                                />
                            ))}
                        </div>

                        <WithdrawalTable
                            withdrawals={withdrawalItems}
                            processingId={processingId}
                            onProcess={processWithdrawal}
                        />

                        <Pagination links={withdrawals?.links ?? []} />
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
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Keuangan marketplace
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Permintaan Penarikan
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Verifikasi rekening, setujui atau tolak pengajuan, kemudian
                    tandai dana yang sudah dicairkan.
                </p>
            </div>

            <Link
                href={route('admin.activity-logs.index')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
                Buka Audit Log
            </Link>
        </section>
    );
}

function StatisticCard({ label, value, valueClassName = 'text-slate-900' }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p
                className={`mt-2 break-words text-2xl font-black ${valueClassName}`}
            >
                {value}
            </p>
        </article>
    );
}

function WithdrawalTable({ withdrawals, processingId, onProcess }) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <Heading>Pengajuan</Heading>
                            <Heading>Vendor</Heading>
                            <Heading>Rekening</Heading>
                            <Heading>Status</Heading>
                            <Heading right>Nominal</Heading>
                            <Heading right>Tindakan</Heading>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {withdrawals.map((withdrawal) => (
                            <tr
                                key={withdrawal.id}
                                className="align-top hover:bg-slate-50"
                            >
                                <td className="px-5 py-4">
                                    <p className="text-sm font-black text-slate-900">
                                        {withdrawal.request_code}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {formatDate(withdrawal.created_at)}
                                    </p>
                                </td>

                                <td className="px-5 py-4">
                                    <p className="text-sm font-black text-slate-900">
                                        {withdrawal.vendor?.shop_name ??
                                            'Vendor'}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {withdrawal.requester?.name ?? '-'}
                                    </p>
                                </td>

                                <td className="px-5 py-4">
                                    <BankAccount withdrawal={withdrawal} />
                                </td>

                                <td className="px-5 py-4">
                                    <StatusBadge status={withdrawal.status} />
                                    {withdrawal.review_note && (
                                        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                            {withdrawal.review_note}
                                        </p>
                                    )}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black text-slate-900">
                                    {formatCurrency(withdrawal.amount)}
                                </td>

                                <td className="px-5 py-4">
                                    <WithdrawalActions
                                        withdrawal={withdrawal}
                                        processing={
                                            processingId === withdrawal.id
                                        }
                                        onProcess={onProcess}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function WithdrawalCard({ withdrawal, processing, onProcess }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-black text-slate-900">
                            {withdrawal.request_code}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(withdrawal.created_at)}
                        </p>
                    </div>
                    <StatusBadge status={withdrawal.status} />
                </div>
            </header>

            <div className="space-y-4 p-4">
                <InfoBlock
                    label="Vendor"
                    primary={withdrawal.vendor?.shop_name ?? 'Vendor'}
                    secondary={withdrawal.requester?.name ?? '-'}
                />

                <div className="rounded-xl bg-slate-50 p-3">
                    <BankAccount withdrawal={withdrawal} />
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Nominal
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-900">
                            {formatCurrency(withdrawal.amount)}
                        </p>
                    </div>
                </div>

                {withdrawal.review_note && (
                    <div className="rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600">
                        <span className="font-black">Catatan:</span>{' '}
                        {withdrawal.review_note}
                    </div>
                )}
            </div>

            <footer className="border-t border-slate-100 p-3">
                <WithdrawalActions
                    withdrawal={withdrawal}
                    processing={processing}
                    onProcess={onProcess}
                    mobile
                />
            </footer>
        </article>
    );
}

function WithdrawalActions({
    withdrawal,
    processing,
    onProcess,
    mobile = false,
}) {
    const className = mobile
        ? 'grid grid-cols-2 gap-2'
        : 'flex justify-end gap-2';

    return (
        <div className={className}>
            {withdrawal.status === 'pending' && (
                <>
                    <ActionButton
                        label="Setujui"
                        processing={processing}
                        onClick={() => onProcess(withdrawal, 'approve')}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    />
                    <ActionButton
                        label="Tolak"
                        processing={processing}
                        onClick={() => onProcess(withdrawal, 'reject')}
                        className="bg-red-600 text-white hover:bg-red-700"
                    />
                </>
            )}

            {withdrawal.status === 'approved' && (
                <ActionButton
                    label="Tandai Dibayar"
                    processing={processing}
                    onClick={() => onProcess(withdrawal, 'paid')}
                    className={`bg-emerald-600 text-white hover:bg-emerald-700 ${
                        mobile ? 'col-span-2' : ''
                    }`}
                />
            )}

            {!['pending', 'approved'].includes(withdrawal.status) && (
                <span className="text-xs font-semibold text-slate-400">
                    Tidak ada tindakan lanjutan
                </span>
            )}
        </div>
    );
}

function ActionButton({ label, processing, onClick, className }) {
    return (
        <button
            type="button"
            disabled={processing}
            onClick={onClick}
            className={`rounded-xl px-3 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {processing ? 'Memproses...' : label}
        </button>
    );
}

function BankAccount({ withdrawal }) {
    return (
        <div>
            <p className="text-sm font-black text-slate-900">
                {withdrawal.bank_name ?? '-'}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
                {withdrawal.bank_account_name ?? '-'}
            </p>
            <p className="mt-1 font-mono text-xs font-bold text-slate-600">
                {withdrawal.bank_account_number ?? '-'}
            </p>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-700'
            }`}
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function InfoBlock({ label, primary, secondary }) {
    return (
        <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 font-black text-slate-900">{primary}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
                {secondary}
            </p>
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
            <div className="text-6xl">🏦</div>
            <h2 className="mt-5 text-2xl font-black text-slate-900">
                Belum ada penarikan
            </h2>
            <p className="mt-2 text-sm text-slate-500">
                Tidak ada permintaan penarikan pada filter yang dipilih.
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
                            ? 'bg-indigo-600 text-white'
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
