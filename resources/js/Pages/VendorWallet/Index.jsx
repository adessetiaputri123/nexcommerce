import WithdrawalForm from '@/Components/WithdrawalForm';
import WithdrawalHistory from '@/Components/WithdrawalHistory';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    usePage,
} from '@inertiajs/react';

export default function Index({
    wallets = [],
    totalBalance = 0,
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const walletItems = Array.isArray(wallets)
        ? wallets
        : Array.isArray(wallets?.data)
            ? wallets.data
            : [];

    const totalTransactions = walletItems.reduce(
        (total, wallet) =>
            total +
            Number(
                wallet.ledger_count ??
                wallet.ledger_entries?.length ??
                0,
            ),
        0,
    );

    const pendingWithdrawals = walletItems.reduce(
        (total, wallet) =>
            total +
            (wallet.withdrawal_requests ?? []).filter(
                (withdrawal) => withdrawal.status === 'pending',
            ).length,
        0,
    );

    return (
        <AuthenticatedLayout>
            <Head title="Wallet Vendor" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                            Keuangan vendor
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-900">
                            Wallet Vendor
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Pantau saldo toko, transaksi wallet, dan permintaan
                            penarikan dana.
                        </p>
                    </div>

                    <Link
                        href={route('vendor.orders.index')}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-black text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                        Pesanan Vendor
                    </Link>
                </div>

                {flash?.message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(flash?.error || errors?.error) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {flash?.error ?? errors?.error}
                    </div>
                )}

                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-sm sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-bold text-emerald-100">
                                Total Saldo
                            </p>
                            <p className="mt-2 text-4xl font-black tracking-tight">
                                {formatCurrency(totalBalance)}
                            </p>
                            <p className="mt-3 text-sm text-emerald-100">
                                Gabungan saldo seluruh toko yang dapat kamu
                                akses.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <MiniStat
                                label="Toko"
                                value={walletItems.length}
                            />
                            <MiniStat
                                label="Transaksi"
                                value={totalTransactions}
                            />
                            <MiniStat
                                label="Penarikan Pending"
                                value={pendingWithdrawals}
                            />
                        </div>
                    </div>
                </section>

                {walletItems.length > 0 ? (
                    <div className="space-y-6">
                        {walletItems.map((wallet) => {
                            const entries = Array.isArray(
                                wallet.ledger_entries,
                            )
                                ? wallet.ledger_entries
                                : [];

                            const withdrawals = Array.isArray(
                                wallet.withdrawal_requests,
                            )
                                ? wallet.withdrawal_requests
                                : [];

                            return (
                                <section
                                    key={
                                        wallet.vendor?.id ??
                                        wallet.id
                                    }
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <header className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-lg font-black text-slate-900">
                                                    {wallet.vendor?.shop_name ??
                                                        'Toko Vendor'}
                                                </h2>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                                    {wallet.ledger_count ??
                                                        entries.length}{' '}
                                                    transaksi
                                                </p>
                                            </div>

                                            <div className="sm:text-right">
                                                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                                    Saldo Toko
                                                </p>
                                                <p className="mt-1 text-2xl font-black text-emerald-700">
                                                    {formatCurrency(
                                                        wallet.balance,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </header>

                                    <div className="space-y-6 p-4 sm:p-5">
                                        {wallet.can_withdraw && (
                                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                                                <WithdrawalForm
                                                    wallet={wallet}
                                                />
                                            </div>
                                        )}

                                        {withdrawals.length > 0 && (
                                            <div className="rounded-2xl border border-slate-100 p-4">
                                                <WithdrawalHistory
                                                    withdrawals={
                                                        withdrawals
                                                    }
                                                />
                                            </div>
                                        )}

                                        {entries.length === 0 ? (
                                            <div className="rounded-2xl bg-slate-50 px-6 py-12 text-center">
                                                <div className="text-5xl">
                                                    💳
                                                </div>
                                                <h3 className="mt-4 font-black text-slate-900">
                                                    Belum ada transaksi
                                                </h3>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Kredit akan muncul setelah
                                                    pesanan berbayar berstatus
                                                    selesai.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid gap-3 md:hidden">
                                                    {entries.map((entry) => (
                                                        <LedgerCard
                                                            key={entry.id}
                                                            entry={entry}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-slate-200">
                                                            <thead className="bg-slate-50">
                                                                <tr>
                                                                    <Heading>
                                                                        Tanggal
                                                                    </Heading>
                                                                    <Heading>
                                                                        Keterangan
                                                                    </Heading>
                                                                    <Heading>
                                                                        Tipe
                                                                    </Heading>
                                                                    <Heading
                                                                        right
                                                                    >
                                                                        Jumlah
                                                                    </Heading>
                                                                    <Heading
                                                                        right
                                                                    >
                                                                        Saldo
                                                                        Akhir
                                                                    </Heading>
                                                                </tr>
                                                            </thead>

                                                            <tbody className="divide-y divide-slate-100">
                                                                {entries.map(
                                                                    (
                                                                        entry,
                                                                    ) => (
                                                                        <LedgerRow
                                                                            key={
                                                                                entry.id
                                                                            }
                                                                            entry={
                                                                                entry
                                                                            }
                                                                        />
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="text-6xl">💳</div>
                        <h2 className="mt-5 text-2xl font-black text-slate-900">
                            Wallet belum tersedia
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Wallet toko akan muncul setelah akses keuangan
                            vendor tersedia.
                        </p>
                    </section>
                )}

                {Array.isArray(wallets?.links) &&
                    wallets.links.length > 3 && (
                        <nav className="flex flex-wrap justify-center gap-2">
                            {wallets.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-xl px-3 py-2 text-sm font-black ${link.active
                                            ? 'bg-emerald-600 text-white'
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
            </div>
        </AuthenticatedLayout>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-100">
                {label}
            </p>
        </div>
    );
}

function LedgerRow({ entry }) {
    const appearance = getEntryAppearance(entry.entry_type);

    return (
        <tr className="hover:bg-slate-50">
            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">
                {formatDate(entry.created_at)}
            </td>

            <td className="px-5 py-4">
                <p className="text-sm font-black text-slate-900">
                    {entry.description ?? 'Transaksi wallet'}
                </p>
                {entry.order_id && (
                    <p className="mt-1 text-xs text-slate-400">
                        Pesanan #{entry.order_id}
                    </p>
                )}
            </td>

            <td className="px-5 py-4">
                <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${appearance.badge}`}
                >
                    {appearance.label}
                </span>
            </td>

            <td
                className={`whitespace-nowrap px-5 py-4 text-right text-sm font-black ${appearance.amountClass}`}
            >
                {appearance.symbol}
                {formatCurrency(entry.amount)}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black text-slate-900">
                {formatCurrency(entry.balance_after)}
            </td>
        </tr>
    );
}

function LedgerCard({ entry }) {
    const appearance = getEntryAppearance(entry.entry_type);

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-black text-slate-900">
                        {entry.description ?? 'Transaksi wallet'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {formatDate(entry.created_at)}
                    </p>
                </div>

                <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${appearance.badge}`}
                >
                    {appearance.label}
                </span>
            </div>

            {entry.order_id && (
                <p className="mt-3 text-xs text-slate-500">
                    Pesanan #{entry.order_id}
                </p>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                <div>
                    <p className="text-xs font-black uppercase text-slate-400">
                        Jumlah
                    </p>
                    <p
                        className={`mt-1 text-lg font-black ${appearance.amountClass}`}
                    >
                        {appearance.symbol}
                        {formatCurrency(entry.amount)}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xs font-black uppercase text-slate-400">
                        Saldo Akhir
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                        {formatCurrency(entry.balance_after)}
                    </p>
                </div>
            </div>
        </article>
    );
}

function Heading({ children, right = false }) {
    return (
        <th
            className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${right ? 'text-right' : 'text-left'
                }`}
        >
            {children}
        </th>
    );
}

function getEntryAppearance(type) {
    if (type === 'credit') {
        return {
            label: 'Kredit',
            badge: 'bg-emerald-100 text-emerald-700',
            amountClass: 'text-emerald-600',
            symbol: '+',
        };
    }

    if (type === 'debit') {
        return {
            label: 'Debit',
            badge: 'bg-red-100 text-red-700',
            amountClass: 'text-red-600',
            symbol: '-',
        };
    }

    return {
        label: type ?? 'Transaksi',
        badge: 'bg-slate-100 text-slate-700',
        amountClass: 'text-slate-700',
        symbol: '',
    };
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