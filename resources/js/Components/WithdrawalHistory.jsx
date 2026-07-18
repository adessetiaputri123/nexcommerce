export default function WithdrawalHistory({
    withdrawals = [],
}) {
    const items = Array.isArray(
        withdrawals,
    )
        ? withdrawals
        : [];

    if (items.length === 0) {
        return null;
    }

    return (
        <section>
            <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Riwayat pencairan
                </p>

                <h3 className="mt-1 text-lg font-black text-slate-900">
                    Riwayat Penarikan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Daftar pengajuan pencairan saldo
                    vendor.
                </p>
            </div>

            <div className="mt-5 grid gap-3 md:hidden">
                {items.map((withdrawal) => (
                    <WithdrawalCard
                        key={withdrawal.id}
                        withdrawal={withdrawal}
                    />
                ))}
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <Heading>
                                    Pengajuan
                                </Heading>
                                <Heading>
                                    Rekening
                                </Heading>
                                <Heading>
                                    Status
                                </Heading>
                                <Heading right>
                                    Nominal
                                </Heading>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {items.map(
                                (withdrawal) => (
                                    <WithdrawalRow
                                        key={
                                            withdrawal.id
                                        }
                                        withdrawal={
                                            withdrawal
                                        }
                                    />
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function WithdrawalRow({
    withdrawal,
}) {
    const appearance = getStatus(
        withdrawal.status,
    );

    return (
        <tr className="align-top hover:bg-slate-50">
            <td className="px-5 py-4">
                <p className="text-sm font-black text-slate-900">
                    {withdrawal.request_code ??
                        `#${withdrawal.id}`}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                    {formatDate(
                        withdrawal.created_at,
                    )}
                </p>

                {withdrawal.vendor_note && (
                    <p className="mt-2 max-w-xs text-xs leading-5 text-slate-600">
                        Catatan:{' '}
                        {withdrawal.vendor_note}
                    </p>
                )}
            </td>

            <td className="px-5 py-4">
                <p className="text-sm font-black text-slate-900">
                    {withdrawal.bank_name ?? '-'}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                    {withdrawal.bank_account_name ??
                        '-'}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-500">
                    {withdrawal.bank_account_number ??
                        '-'}
                </p>
            </td>

            <td className="px-5 py-4">
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${appearance.className}`}
                >
                    {appearance.label}
                </span>

                {withdrawal.review_note && (
                    <p className="mt-2 max-w-xs text-xs leading-5 text-slate-600">
                        {withdrawal.review_note}
                    </p>
                )}

                {withdrawal.paid_at && (
                    <p className="mt-2 text-xs font-black text-emerald-600">
                        Dibayar{' '}
                        {formatDate(
                            withdrawal.paid_at,
                        )}
                    </p>
                )}
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black text-slate-900">
                {formatCurrency(
                    withdrawal.amount,
                )}
            </td>
        </tr>
    );
}

function WithdrawalCard({
    withdrawal,
}) {
    const appearance = getStatus(
        withdrawal.status,
    );

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-black text-slate-900">
                        {withdrawal.request_code ??
                            `#${withdrawal.id}`}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDate(
                            withdrawal.created_at,
                        )}
                    </p>
                </div>

                <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${appearance.className}`}
                >
                    {appearance.label}
                </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-900">
                    {withdrawal.bank_name ?? '-'}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    {withdrawal.bank_account_name ??
                        '-'}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-500">
                    {withdrawal.bank_account_number ??
                        '-'}
                </p>
            </div>

            {(withdrawal.vendor_note ||
                withdrawal.review_note) && (
                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                    {withdrawal.vendor_note && (
                        <p>
                            Catatan vendor:{' '}
                            {withdrawal.vendor_note}
                        </p>
                    )}

                    {withdrawal.review_note && (
                        <p>
                            Catatan admin:{' '}
                            {withdrawal.review_note}
                        </p>
                    )}
                </div>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Nominal
                </span>

                <span className="text-lg font-black text-slate-900">
                    {formatCurrency(
                        withdrawal.amount,
                    )}
                </span>
            </div>
        </article>
    );
}

function Heading({
    children,
    right = false,
}) {
    return (
        <th
            className={`px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500 ${
                right
                    ? 'text-right'
                    : 'text-left'
            }`}
        >
            {children}
        </th>
    );
}

function getStatus(status) {
    const statuses = {
        pending: {
            label: 'Menunggu',
            className:
                'bg-amber-100 text-amber-700',
        },
        approved: {
            label: 'Disetujui',
            className:
                'bg-blue-100 text-blue-700',
        },
        rejected: {
            label: 'Ditolak',
            className:
                'bg-red-100 text-red-700',
        },
        paid: {
            label: 'Sudah Dibayar',
            className:
                'bg-emerald-100 text-emerald-700',
        },
    };

    return (
        statuses[status] ?? {
            label: status ?? '-',
            className:
                'bg-slate-100 text-slate-700',
        }
    );
}

function formatCurrency(value) {
    const number = Number(value ?? 0);

    return `Rp ${Number.isFinite(number)
        ? number.toLocaleString('id-ID', {
              maximumFractionDigits: 0,
          })
        : '0'}`;
}

function parseDateTime(value) {
    if (!value) {
        return null;
    }

    const normalized = String(value).trim();
    const localWitaMatch = normalized.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

    const parseValue = localWitaMatch
        ? `${localWitaMatch[1]}-${localWitaMatch[2]}-${localWitaMatch[3]}T${localWitaMatch[4]}:${localWitaMatch[5]}:${localWitaMatch[6] ?? '00'}+08:00`
        : normalized;

    const timestamp = Date.parse(parseValue);

    return Number.isNaN(timestamp)
        ? null
        : timestamp;
}

function formatDate(value) {
    const timestamp = parseDateTime(value);

    if (timestamp === null) {
        return '-';
    }

    return `${new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(timestamp))} WITA`;
}
