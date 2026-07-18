import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import { useState } from 'react';

const STATUS_OPTIONS = [
    {
        value: 'all',
        label: 'Semua Status',
    },
    {
        value: 'active',
        label: 'Sedang Aktif',
    },
    {
        value: 'scheduled',
        label: 'Terjadwal',
    },
    {
        value: 'inactive',
        label: 'Nonaktif',
    },
    {
        value: 'expired',
        label: 'Berakhir',
    },
];

export default function Index({
    promotions,
    statistics = {},
    filters = {},
    campaignTypes = [],
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const [search, setSearch] = useState(
        filters.search ?? '',
    );

    const [status, setStatus] = useState(
        filters.status ?? 'all',
    );

    const [
        campaignType,
        setCampaignType,
    ] = useState(
        filters.campaign_type ?? 'all',
    );

    const [
        processingPromotionId,
        setProcessingPromotionId,
    ] = useState(null);

    const promotionItems =
        promotions?.data ?? [];

    const formatCurrency = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '-';
        }

        return `Rp ${Number(
            value,
        ).toLocaleString('id-ID')}`;
    };

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        const match = String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,
        );

        if (!match) {
            return '-';
        }

        const [
            ,
            year,
            month,
            day,
            hour,
            minute,
        ] = match;

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
        );

        const formattedDate =
            new Intl.DateTimeFormat(
                'id-ID',
                {
                    dateStyle: 'medium',
                },
            ).format(date);

        return `${formattedDate}, ${hour}.${minute} WITA`;
    };

    const getStatusStyle = (
        promotionStatus,
    ) => {
        switch (promotionStatus) {
            case 'active':
                return {
                    label: 'Aktif',
                    className:
                        'bg-emerald-100 text-emerald-700',
                };

            case 'scheduled':
                return {
                    label: 'Terjadwal',
                    className:
                        'bg-blue-100 text-blue-700',
                };

            case 'expired':
                return {
                    label: 'Berakhir',
                    className:
                        'bg-gray-200 text-gray-700',
                };

            case 'inactive':
                return {
                    label: 'Nonaktif',
                    className:
                        'bg-red-100 text-red-700',
                };

            default:
                return {
                    label:
                        promotionStatus ??
                        'Tidak diketahui',
                    className:
                        'bg-gray-100 text-gray-700',
                };
        }
    };

    const submitFilters = (
        event,
    ) => {
        event.preventDefault();

        router.get(
            route(
                'admin.promotions.index',
            ),
            {
                search:
                    search.trim() ||
                    undefined,

                status:
                    status === 'all'
                        ? undefined
                        : status,

                campaign_type:
                    campaignType ===
                        'all'
                        ? undefined
                        : campaignType,
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
        setStatus('all');
        setCampaignType('all');

        router.get(
            route(
                'admin.promotions.index',
            ),
            {},
            {
                preserveState: false,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const togglePromotion = (
        promotion,
    ) => {
        const action =
            promotion.is_active
                ? 'menonaktifkan'
                : 'mengaktifkan';

        const confirmed =
            window.confirm(
                `Yakin ingin ${action} promo "${promotion.name}"?`,
            );

        if (!confirmed) {
            return;
        }

        router.patch(
            route(
                'admin.promotions.toggle',
                promotion.id,
            ),
            {},
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessingPromotionId(
                        promotion.id,
                    );
                },

                onFinish: () => {
                    setProcessingPromotionId(
                        null,
                    );
                },
            },
        );
    };

    const deletePromotion = (
        promotion,
    ) => {
        const confirmed =
            window.confirm(
                `Hapus promo "${promotion.name}" secara permanen?`,
            );

        if (!confirmed) {
            return;
        }

        router.delete(
            route(
                'admin.promotions.destroy',
                promotion.id,
            ),
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessingPromotionId(
                        promotion.id,
                    );
                },

                onFinish: () => {
                    setProcessingPromotionId(
                        null,
                    );
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Promo" />



            <div className="space-y-6">
                {flash?.message && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(flash?.error ||
                    errors?.error) && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                            {flash?.error ??
                                errors?.error}
                        </div>
                    )}

                <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-violet-100">
                                NexCommerce Admin
                            </p>

                            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                                Promo dan Diskon
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
                                Jadwalkan promo tanggal
                                kembar, awal bulan,
                                akhir bulan, hari raya,
                                dan perayaan khusus.
                            </p>
                        </div>

                        <Link
                            href={route(
                                'admin.promotions.create',
                            )}
                            className="inline-flex justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-700 shadow-sm hover:bg-violet-50"
                        >
                            + Buat Promo
                        </Link>
                    </div>
                </section>

                <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatisticCard
                        label="Total Promo"
                        value={
                            statistics.total ??
                            0
                        }
                    />

                    <StatisticCard
                        label="Sedang Aktif"
                        value={
                            statistics.active ??
                            0
                        }
                        valueClassName="text-emerald-600"
                    />

                    <StatisticCard
                        label="Terjadwal"
                        value={
                            statistics.scheduled ??
                            0
                        }
                        valueClassName="text-blue-600"
                    />

                    <StatisticCard
                        label="Nonaktif"
                        value={
                            statistics.inactive ??
                            0
                        }
                        valueClassName="text-red-600"
                    />

                    <StatisticCard
                        label="Berakhir"
                        value={
                            statistics.expired ??
                            0
                        }
                        valueClassName="text-gray-600"
                    />
                </section>

                <form
                    onSubmit={submitFilters}
                    className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
                        <div>
                            <label
                                htmlFor="search"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Cari Promo
                            </label>

                            <input
                                id="search"
                                type="search"
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Nama atau deskripsi promo..."
                                className="w-full rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Status
                            </label>

                            <select
                                id="status"
                                value={status}
                                onChange={(
                                    event,
                                ) =>
                                    setStatus(
                                        event.target
                                            .value,
                                    )
                                }
                                className="w-full rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-violet-500 focus:ring-violet-500"
                            >
                                {STATUS_OPTIONS.map(
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

                        <div>
                            <label
                                htmlFor="campaign_type"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Jenis Kampanye
                            </label>

                            <select
                                id="campaign_type"
                                value={
                                    campaignType
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCampaignType(
                                        event.target
                                            .value,
                                    )
                                }
                                className="w-full rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-violet-500 focus:ring-violet-500"
                            >
                                <option value="all">
                                    Semua Kampanye
                                </option>

                                {campaignTypes.map(
                                    (type) => (
                                        <option
                                            key={
                                                type.value
                                            }
                                            value={
                                                type.value
                                            }
                                        >
                                            {
                                                type.label
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
                            >
                                Terapkan
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>

                {promotionItems.length ===
                    0 ? (
                    <section className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="text-6xl">
                            🏷️
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            Belum ada promo
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Buat promo pertama untuk
                            produk NexCommerce.
                        </p>

                        <Link
                            href={route(
                                'admin.promotions.create',
                            )}
                            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700"
                        >
                            + Buat Promo
                        </Link>
                    </section>
                ) : (
                    <>
                        <div className="grid gap-4 lg:hidden">
                            {promotionItems.map(
                                (promotion) => (
                                    <PromotionCard
                                        key={
                                            promotion.id
                                        }
                                        promotion={
                                            promotion
                                        }
                                        processing={
                                            processingPromotionId ===
                                            promotion.id
                                        }
                                        formatCurrency={
                                            formatCurrency
                                        }
                                        formatDateTime={
                                            formatDateTime
                                        }
                                        getStatusStyle={
                                            getStatusStyle
                                        }
                                        onToggle={
                                            togglePromotion
                                        }
                                        onDelete={
                                            deletePromotion
                                        }
                                    />
                                ),
                            )}
                        </div>

                        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Promo
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Diskon
                                            </th>

                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Jadwal
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Produk
                                            </th>

                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Status
                                            </th>

                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {promotionItems.map(
                                            (
                                                promotion,
                                            ) => {
                                                const statusData =
                                                    getStatusStyle(
                                                        promotion.status,
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            promotion.id
                                                        }
                                                        className="align-top hover:bg-gray-50"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-gray-900">
                                                                {
                                                                    promotion.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-violet-600">
                                                                {
                                                                    promotion.campaign_label
                                                                }
                                                            </p>

                                                            <p className="mt-2 max-w-sm text-sm text-gray-500">
                                                                {promotion.description ||
                                                                    'Tidak ada deskripsi.'}
                                                            </p>

                                                            <p className="mt-2 text-xs text-gray-400">
                                                                Prioritas:{' '}
                                                                {
                                                                    promotion.priority
                                                                }
                                                            </p>
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4">
                                                            <p className="text-lg font-black text-violet-700">
                                                                {
                                                                    promotion.discount_label
                                                                }
                                                            </p>

                                                            {promotion.minimum_order_amount && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Minimal{' '}
                                                                    {formatCurrency(
                                                                        promotion.minimum_order_amount,
                                                                    )}
                                                                </p>
                                                            )}

                                                            {promotion.maximum_discount_amount && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Maksimal{' '}
                                                                    {formatCurrency(
                                                                        promotion.maximum_discount_amount,
                                                                    )}
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                            <p>
                                                                <span className="font-semibold text-gray-800">
                                                                    Mulai
                                                                </span>
                                                                <br />
                                                                {formatDateTime(
                                                                    promotion.starts_at,
                                                                )}
                                                            </p>

                                                            <p className="mt-3">
                                                                <span className="font-semibold text-gray-800">
                                                                    Berakhir
                                                                </span>
                                                                <br />
                                                                {formatDateTime(
                                                                    promotion.ends_at,
                                                                )}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4 text-center">
                                                            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                                                                {
                                                                    promotion.products_count
                                                                }{' '}
                                                                produk
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4 text-center">
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusData.className}`}
                                                            >
                                                                {
                                                                    statusData.label
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-end gap-2">
                                                                <Link
                                                                    href={route(
                                                                        'admin.promotions.edit',
                                                                        promotion.id,
                                                                    )}
                                                                    className="rounded-lg bg-violet-100 px-3 py-2 text-sm font-bold text-violet-700 hover:bg-violet-200"
                                                                >
                                                                    Edit
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        togglePromotion(
                                                                            promotion,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processingPromotionId ===
                                                                        promotion.id
                                                                    }
                                                                    className={`rounded-lg px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${promotion.is_active
                                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                        }`}
                                                                >
                                                                    {promotion.is_active
                                                                        ? 'Nonaktifkan'
                                                                        : 'Aktifkan'}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        deletePromotion(
                                                                            promotion,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processingPromotionId ===
                                                                        promotion.id
                                                                    }
                                                                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <Pagination
                            links={
                                promotions?.links ??
                                []
                            }
                        />
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function StatisticCard({
    label,
    value,
    valueClassName = 'text-gray-900',
}) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </p>

            <p
                className={`mt-2 text-2xl font-black ${valueClassName}`}
            >
                {value}
            </p>
        </article>
    );
}

function PromotionCard({
    promotion,
    processing,
    formatCurrency,
    formatDateTime,
    getStatusStyle,
    onToggle,
    onDelete,
}) {
    const statusData =
        getStatusStyle(
            promotion.status,
        );

    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-gray-900">
                        {promotion.name}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-violet-600">
                        {
                            promotion.campaign_label
                        }
                    </p>
                </div>

                <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusData.className}`}
                >
                    {statusData.label}
                </span>
            </div>

            <p className="mt-4 text-2xl font-black text-violet-700">
                {promotion.discount_label}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                        Mulai
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                        {formatDateTime(
                            promotion.starts_at,
                        )}
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                        Berakhir
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                        {formatDateTime(
                            promotion.ends_at,
                        )}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-3 py-1 font-bold text-indigo-700">
                    {promotion.products_count}{' '}
                    produk
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-700">
                    Prioritas{' '}
                    {promotion.priority}
                </span>

                {promotion.minimum_order_amount && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-700">
                        Minimal{' '}
                        {formatCurrency(
                            promotion.minimum_order_amount,
                        )}
                    </span>
                )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
                <Link
                    href={route(
                        'admin.promotions.edit',
                        promotion.id,
                    )}
                    className="rounded-lg bg-violet-100 px-3 py-2 text-center text-xs font-bold text-violet-700 hover:bg-violet-200"
                >
                    Edit
                </Link>

                <button
                    type="button"
                    onClick={() =>
                        onToggle(
                            promotion,
                        )
                    }
                    disabled={processing}
                    className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${promotion.is_active
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                        }`}
                >
                    {promotion.is_active
                        ? 'Nonaktif'
                        : 'Aktifkan'}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onDelete(
                            promotion,
                        )
                    }
                    disabled={processing}
                    className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                >
                    Hapus
                </button>
            </div>
        </article>
    );
}

function Pagination({
    links = [],
}) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className="mt-6 flex flex-wrap justify-center gap-2">
            {links.map(
                (link, index) => (
                    <Link
                        key={`${link.label}-${index}`}
                        href={
                            link.url ?? '#'
                        }
                        preserveScroll
                        preserveState
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${link.active
                            ? 'border-violet-600 bg-violet-600 text-white'
                            : link.url
                                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
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