import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';
import {
    useMemo,
    useState,
} from 'react';

const WITA_TIME_ZONE = 'Asia/Makassar';

const toDateTimeLocal = (date) => {
    const parts =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone: WITA_TIME_ZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
            },
        ).formatToParts(date);

    const values = Object.fromEntries(
        parts.map((part) => [
            part.type,
            part.value,
        ]),
    );

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

const normalizeDateTimeLocal = (value) => {
    if (!value) {
        return '';
    }

    const match = String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,
    );

    if (!match) {
        return '';
    }

    const [
        ,
        year,
        month,
        day,
        hour,
        minute,
    ] = match;

    return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toServerDateTime = (value) =>
    normalizeDateTimeLocal(value);

export default function Edit({
    promotion = null,
    products = [],
    campaignTypes = [],
    discountTypes = [],
}) {
    const [productSearch, setProductSearch] =
        useState('');

    const promotionId =
        promotion?.id ?? null;

    const {
        data,
        setData,
        put,
        transform,
        processing,
        errors,
    } = useForm({
        name:
            promotion?.name ?? '',

        description:
            promotion?.description ?? '',

        campaign_type:
            promotion?.campaign_type ??
            campaignTypes[0]?.value ??
            'custom',

        discount_type:
            promotion?.discount_type ??
            discountTypes[0]?.value ??
            'percentage',

        discount_value:
            promotion?.discount_value ?? '',

        minimum_order_amount:
            promotion?.minimum_order_amount ?? '',

        maximum_discount_amount:
            promotion?.maximum_discount_amount ?? '',

        starts_at:
            normalizeDateTimeLocal(
                promotion?.starts_at,
            ),

        ends_at:
            normalizeDateTimeLocal(
                promotion?.ends_at,
            ),

        priority:
            promotion?.priority ?? 0,

        is_active:
            Boolean(
                promotion?.is_active,
            ),

        product_ids:
            (
                promotion?.product_ids ??
                []
            ).map(
                (productId) =>
                    Number(productId),
            ),
    });

    const filteredProducts =
        useMemo(() => {
            const keyword =
                productSearch
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return products;
            }

            return products.filter(
                (product) =>
                    [
                        product.name,
                        product.vendor_name,
                        product.label,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                        .includes(keyword),
            );
        }, [
            products,
            productSearch,
        ]);

    const selectedProductIds =
        useMemo(
            () =>
                new Set(
                    data.product_ids.map(
                        (id) => Number(id),
                    ),
                ),
            [data.product_ids],
        );

    const allFilteredSelected =
        filteredProducts.length > 0 &&
        filteredProducts.every(
            (product) =>
                selectedProductIds.has(
                    Number(product.id),
                ),
        );

    const formatCurrency = (value) => {
        if (
            value === '' ||
            value === null ||
            value === undefined
        ) {
            return '-';
        }

        return `Rp ${Number(
            value,
        ).toLocaleString('id-ID')}`;
    };

    const toggleProduct = (
        productId,
    ) => {
        const normalizedId =
            Number(productId);

        if (
            selectedProductIds.has(
                normalizedId,
            )
        ) {
            setData(
                'product_ids',
                data.product_ids.filter(
                    (id) =>
                        Number(id) !==
                        normalizedId,
                ),
            );

            return;
        }

        if (
            data.product_ids.length >=
            500
        ) {
            return;
        }

        setData(
            'product_ids',
            [
                ...data.product_ids,
                normalizedId,
            ],
        );
    };

    const toggleAllFiltered = () => {
        const filteredIds =
            filteredProducts.map(
                (product) =>
                    Number(product.id),
            );

        if (allFilteredSelected) {
            setData(
                'product_ids',
                data.product_ids.filter(
                    (id) =>
                        !filteredIds.includes(
                            Number(id),
                        ),
                ),
            );

            return;
        }

        setData(
            'product_ids',
            Array.from(
                new Set([
                    ...data.product_ids.map(
                        (id) => Number(id),
                    ),
                    ...filteredIds,
                ]),
            ).slice(0, 500),
        );
    };

    const applySchedule = (
        numberOfDays,
    ) => {
        const startsAt =
            new Date();

        const endsAt =
            new Date(startsAt);

        endsAt.setDate(
            endsAt.getDate() +
            numberOfDays,
        );

        setData({
            ...data,

            starts_at:
                toDateTimeLocal(
                    startsAt,
                ),

            ends_at:
                toDateTimeLocal(
                    endsAt,
                ),
        });
    };

    const applyEndOfMonthSchedule =
        () => {
            const current =
                new Date();

            const lastDay =
                new Date(
                    current.getFullYear(),
                    current.getMonth() + 1,
                    0,
                );

            const startsAt =
                new Date(
                    lastDay.getFullYear(),
                    lastDay.getMonth(),
                    Math.max(
                        1,
                        lastDay.getDate() - 2,
                    ),
                    0,
                    0,
                    0,
                );

            const endsAt =
                new Date(
                    lastDay.getFullYear(),
                    lastDay.getMonth(),
                    lastDay.getDate(),
                    23,
                    59,
                    0,
                );

            setData({
                ...data,

                campaign_type:
                    'end_month',

                starts_at:
                    toDateTimeLocal(
                        startsAt,
                    ),

                ends_at:
                    toDateTimeLocal(
                        endsAt,
                    ),
            });
        };

    const submit = (event) => {
        event.preventDefault();

        if (!promotionId) {
            return;
        }

        transform((formData) => ({
            ...formData,
            starts_at:
                toServerDateTime(
                    formData.starts_at,
                ),
            ends_at:
                toServerDateTime(
                    formData.ends_at,
                ),
        }));

        put(
            route(
                'admin.promotions.update',
                promotionId,
            ),
            {
                preserveScroll: true,
            },
        );
    };

    if (!promotionId) {
        return (
            <AuthenticatedLayout>
                <Head title="Data Promo Tidak Ditemukan" />

                <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <div className="text-5xl">
                        ⚠️
                    </div>

                    <h1 className="mt-4 text-xl font-black text-gray-900">
                        Data Promo Tidak Ditemukan
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Controller belum mengirim data promo
                        ke halaman edit.
                    </p>

                    <Link
                        href={route(
                            'admin.promotions.index',
                        )}
                        className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700"
                    >
                        Kembali ke Daftar Promo
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head
                title={`Edit ${promotion?.name ?? 'Promo'}`}
            />



            <div className="space-y-7">
                <div className="mb-7">
                    <p className="text-sm font-bold text-violet-600">
                        NexCommerce Admin
                    </p>

                    <h1 className="mt-1 text-3xl font-black text-gray-900">
                        Edit Promo
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Perbarui diskon, jadwal,
                        prioritas, dan produk promo.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-violet-100 px-3 py-1 font-bold text-violet-700">
                            ID Promo: {promotionId}
                        </span>

                        <span
                            className={`rounded-full px-3 py-1 font-bold ${data.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                                }`}
                        >
                            {data.is_active
                                ? 'Status Aktif'
                                : 'Status Nonaktif'}
                        </span>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-7"
                >
                    {errors.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                            {errors.error}
                        </div>
                    )}

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900">
                            Informasi Promo
                        </h2>

                        <div className="mt-6 grid gap-5 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Nama Promo
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="campaign_type"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Jenis Kampanye
                                </label>

                                <select
                                    id="campaign_type"
                                    value={data.campaign_type}
                                    onChange={(event) =>
                                        setData(
                                            'campaign_type',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                >
                                    {campaignTypes.map(
                                        (type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ),
                                    )}
                                </select>

                                {errors.campaign_type && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.campaign_type}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="priority"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Prioritas
                                </label>

                                <input
                                    id="priority"
                                    type="number"
                                    min="0"
                                    max="100000"
                                    value={data.priority}
                                    onChange={(event) =>
                                        setData(
                                            'priority',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.priority && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.priority}
                                    </p>
                                )}
                            </div>

                            <div className="lg:col-span-2">
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Deskripsi
                                </label>

                                <textarea
                                    id="description"
                                    rows={4}
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.description && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900">
                            Nilai Diskon
                        </h2>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="discount_type"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Jenis Diskon
                                </label>

                                <select
                                    id="discount_type"
                                    value={data.discount_type}
                                    onChange={(event) =>
                                        setData(
                                            'discount_type',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                >
                                    {discountTypes.map(
                                        (type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ),
                                    )}
                                </select>

                                {errors.discount_type && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.discount_type}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="discount_value"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Nilai Diskon
                                </label>

                                <input
                                    id="discount_value"
                                    type="number"
                                    min="0.01"
                                    max={
                                        data.discount_type ===
                                            'percentage'
                                            ? 100
                                            : undefined
                                    }
                                    step="0.01"
                                    value={data.discount_value}
                                    onChange={(event) =>
                                        setData(
                                            'discount_value',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.discount_value && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.discount_value}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="minimum_order_amount"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Minimal Pembelian
                                </label>

                                <input
                                    id="minimum_order_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.minimum_order_amount}
                                    onChange={(event) =>
                                        setData(
                                            'minimum_order_amount',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                    {formatCurrency(
                                        data.minimum_order_amount,
                                    )}
                                </p>

                                {errors.minimum_order_amount && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.minimum_order_amount}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="maximum_discount_amount"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Maksimal Potongan
                                </label>

                                <input
                                    id="maximum_discount_amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={data.maximum_discount_amount}
                                    onChange={(event) =>
                                        setData(
                                            'maximum_discount_amount',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                    {formatCurrency(
                                        data.maximum_discount_amount,
                                    )}
                                </p>

                                {errors.maximum_discount_amount && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.maximum_discount_amount}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Jadwal Promo
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Atur waktu mulai dan berakhir promo.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        applySchedule(1)
                                    }
                                    className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                                >
                                    1 Hari
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        applySchedule(3)
                                    }
                                    className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                                >
                                    3 Hari
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        applyEndOfMonthSchedule
                                    }
                                    className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-200"
                                >
                                    Akhir Bulan
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="starts_at"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Mulai
                                </label>

                                <input
                                    id="starts_at"
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(event) =>
                                        setData(
                                            'starts_at',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.starts_at && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.starts_at}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="ends_at"
                                    className="mb-2 block text-sm font-bold text-gray-700"
                                >
                                    Berakhir
                                </label>

                                <input
                                    id="ends_at"
                                    type="datetime-local"
                                    value={data.ends_at}
                                    onChange={(event) =>
                                        setData(
                                            'ends_at',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />

                                {errors.ends_at && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.ends_at}
                                    </p>
                                )}
                            </div>
                        </div>

                        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) =>
                                    setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />

                            <div>
                                <p className="font-bold text-gray-900">
                                    Aktifkan Promo
                                </p>

                                <p className="text-sm text-gray-500">
                                    Promo aktif sesuai jadwal yang ditentukan.
                                </p>
                            </div>
                        </label>

                        {errors.is_active && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.is_active}
                            </p>
                        )}
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    Produk Promo
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Pilih maksimal 500 produk.
                                </p>
                            </div>

                            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                                {data.product_ids.length} dipilih
                            </span>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <input
                                type="search"
                                value={productSearch}
                                onChange={(event) =>
                                    setProductSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Cari produk atau toko..."
                                className="min-w-0 flex-1 rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                            />

                            <button
                                type="button"
                                onClick={
                                    toggleAllFiltered
                                }
                                className="rounded-xl bg-violet-100 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-200"
                            >
                                {allFilteredSelected
                                    ? 'Batalkan Semua'
                                    : 'Pilih Semua'}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setData(
                                        'product_ids',
                                        [],
                                    )
                                }
                                disabled={
                                    data.product_ids.length === 0
                                }
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Kosongkan
                            </button>
                        </div>

                        {errors.product_ids && (
                            <p className="mt-3 text-sm text-red-600">
                                {errors.product_ids}
                            </p>
                        )}

                        <div className="mt-5 max-h-[480px] overflow-y-auto rounded-xl border border-gray-200">
                            {filteredProducts.length === 0 ? (
                                <div className="px-5 py-12 text-center text-sm text-gray-500">
                                    Produk tidak ditemukan.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredProducts.map(
                                        (product) => {
                                            const selected =
                                                selectedProductIds.has(
                                                    Number(product.id),
                                                );

                                            return (
                                                <label
                                                    key={product.id}
                                                    className={`flex cursor-pointer items-center gap-4 px-4 py-4 transition hover:bg-violet-50 ${selected
                                                        ? 'bg-violet-50'
                                                        : 'bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() =>
                                                            toggleProduct(
                                                                product.id,
                                                            )
                                                        }
                                                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-bold text-gray-900">
                                                            {product.name}
                                                        </p>

                                                        <p className="mt-1 truncate text-sm text-gray-500">
                                                            {product.vendor_name}
                                                        </p>
                                                    </div>

                                                    <span className="shrink-0 text-xs text-gray-400">
                                                        ID {product.id}
                                                    </span>
                                                </label>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={route(
                                'admin.promotions.index',
                            )}
                            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-center font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Menyimpan Perubahan...'
                                : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}