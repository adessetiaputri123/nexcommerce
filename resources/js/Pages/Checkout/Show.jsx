import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import { useState } from 'react';

export default function Show({
    checkout = {},
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const [
        processing,
        setProcessing,
    ] = useState(false);

    const vendorGroups =
        Array.isArray(
            checkout?.vendors,
        )
            ? checkout.vendors
            : [];

    const placeOrder = () => {
        const confirmed =
            window.confirm(
                'Buat pesanan sekarang? Stok produk akan dikurangi setelah pesanan berhasil dibuat.',
            );

        if (!confirmed) {
            return;
        }

        router.post(
            route(
                'checkout.store',
            ),
            {},
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessing(
                        true,
                    );
                },

                onFinish: () => {
                    setProcessing(
                        false,
                    );
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Checkout" />

            <div className="space-y-6">
                <PageHeader />

                <Feedback
                    flash={flash}
                    errors={errors}
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        {vendorGroups.map(
                            (
                                vendorGroup,
                                vendorIndex,
                            ) => (
                                <VendorCheckoutGroup
                                    key={
                                        vendorGroup
                                            ?.vendor
                                            ?.id ??
                                        vendorGroup
                                            ?.vendor_id ??
                                        vendorIndex
                                    }
                                    vendorGroup={
                                        vendorGroup
                                    }
                                />
                            ),
                        )}
                    </div>

                    <CheckoutSummary
                        checkout={
                            checkout
                        }
                        processing={
                            processing
                        }
                        onPlaceOrder={
                            placeOrder
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader() {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Konfirmasi pesanan
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Checkout
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Periksa kembali produk, harga, jumlah, dan ongkos kirim sebelum membuat pesanan.
                </p>
            </div>

            <Link
                href={
                    route(
                        'cart.index',
                    )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
                <Icon
                    name="arrowLeft"
                    className="h-4 w-4"
                />

                Kembali ke Keranjang
            </Link>
        </section>
    );
}

function Feedback({
    flash,
    errors,
}) {
    const errorMessage =
        flash?.error ??
        errors?.error ??
        errors?.cart ??
        null;

    return (
        <>
            {flash?.message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                    {
                        flash.message
                    }
                </div>
            )}

            {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                    {
                        errorMessage
                    }
                </div>
            )}
        </>
    );
}

function VendorCheckoutGroup({
    vendorGroup,
}) {
    const items =
        Array.isArray(
            vendorGroup?.items,
        )
            ? vendorGroup.items
            : [];

    const vendorName =
        vendorGroup?.vendor
            ?.shop_name ??
        'Vendor NexCommerce';

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Icon
                        name="store"
                        className="h-5 w-5"
                    />
                </span>

                <div className="min-w-0">
                    <p className="truncate font-black text-slate-900">
                        {
                            vendorName
                        }
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                        {
                            items.length
                        }{' '}
                        jenis produk
                    </p>
                </div>
            </header>

            <div className="divide-y divide-slate-100">
                {items.map(
                    (item) => (
                        <CheckoutItem
                            key={
                                item.cart_item_id ??
                                item.id
                            }
                            item={item}
                        />
                    ),
                )}
            </div>

            <footer className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="space-y-3 text-sm">
                    <SummaryRow
                        label="Subtotal toko"
                        value={formatCurrency(
                            vendorGroup?.subtotal,
                        )}
                    />

                    <SummaryRow
                        label="Ongkos kirim"
                        value={formatCurrency(
                            vendorGroup?.shipping_cost,
                        )}
                    />

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="font-black text-slate-900">
                            Total toko
                        </span>

                        <span className="text-base font-black text-indigo-700">
                            {formatCurrency(
                                vendorGroup?.total,
                            )}
                        </span>
                    </div>
                </div>
            </footer>
        </section>
    );
}

function CheckoutItem({
    item,
}) {
    const quantity =
        Number(
            item?.quantity ??
            0,
        );

    const finalUnitPrice =
        Number(
            item?.final_unit_price ??
            item?.price ??
            0,
        );

    const originalUnitPrice =
        Number(
            item?.original_unit_price ??
            item?.original_price ??
            item?.sku
                ?.original_price ??
            finalUnitPrice,
        );

    const discountPerUnit =
        Math.max(
            0,
            originalUnitPrice -
            finalUnitPrice,
        );

    const discountTotal =
        Number(
            item?.discount_amount ??
            discountPerUnit *
            quantity,
        );

    const hasDiscount =
        discountTotal >
        0 ||
        originalUnitPrice >
        finalUnitPrice;

    const imageUrl =
        item?.product
            ?.primary_image
            ?.image_url ??
        item?.product
            ?.primaryImage
            ?.image_url ??
        item?.product
            ?.primary_image_url ??
        item?.product
            ?.images?.[0]
            ?.image_url ??
        null;

    const skuCode =
        item?.sku?.code ??
        item?.sku?.sku ??
        '-';

    const promotionName =
        item?.promotion
            ?.name ??
        item?.promotion_name ??
        null;

    return (
        <article className="p-4 sm:p-5">
            <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-28">
                    {imageUrl ? (
                        <img
                            src={
                                imageUrl
                            }
                            alt={
                                item?.product
                                    ?.name ??
                                'Produk'
                            }
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-4xl">
                            📦
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="line-clamp-2 font-black leading-6 text-slate-900">
                                {item?.product
                                    ?.name ??
                                    'Produk'}
                            </h3>

                            <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                                SKU{' '}
                                {
                                    skuCode
                                }
                            </p>
                        </div>

                        <div className="sm:text-right">
                            <p className="text-xs font-semibold text-slate-500">
                                Subtotal
                            </p>

                            <p className="mt-1 text-lg font-black text-slate-900">
                                {formatCurrency(
                                    item?.subtotal,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {hasDiscount && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                                {formatCurrency(
                                    originalUnitPrice,
                                )}
                            </span>
                        )}

                        <span className={`text-sm font-black ${hasDiscount ? 'text-red-600' : 'text-emerald-700'}`}>
                            {formatCurrency(
                                finalUnitPrice,
                            )}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                            ×{' '}
                            {
                                quantity
                            }
                        </span>

                        {hasDiscount && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                Harga promo
                            </span>
                        )}
                    </div>

                    {promotionName && (
                        <p className="mt-2 inline-flex max-w-full rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                            <span className="truncate">
                                {
                                    promotionName
                                }
                            </span>
                        </p>
                    )}

                    {hasDiscount &&
                        discountTotal >
                        0 && (
                            <p className="mt-2 text-xs font-bold text-red-600">
                                Hemat{' '}
                                {formatCurrency(
                                    discountTotal,
                                )}
                            </p>
                        )}

                    <p className="mt-3 text-xs font-semibold text-slate-400">
                        Stok tersedia:{' '}
                        {item?.sku
                            ?.stock ??
                            0}
                    </p>
                </div>
            </div>
        </article>
    );
}

function CheckoutSummary({
    checkout,
    processing,
    onPlaceOrder,
}) {
    const totalSavings =
        calculateTotalSavings(
            checkout,
        );

    return (
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Icon
                        name="receipt"
                        className="h-6 w-6"
                    />
                </span>

                <div>
                    <h2 className="text-lg font-black text-slate-900">
                        Ringkasan Checkout
                    </h2>

                    <p className="text-xs font-semibold text-slate-500">
                        Total akhir pesanan
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <SummaryRow
                    label="Jumlah barang"
                    value={
                        checkout?.item_count ??
                        0
                    }
                />

                <SummaryRow
                    label="Subtotal produk"
                    value={formatCurrency(
                        checkout?.product_subtotal,
                    )}
                />

                <SummaryRow
                    label="Total pengiriman"
                    value={formatCurrency(
                        checkout?.shipping_total,
                    )}
                />

                {totalSavings > 0 && (
                    <SummaryRow
                        label="Total hemat"
                        value={formatCurrency(
                            totalSavings,
                        )}
                        valueClassName="text-red-600"
                    />
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="font-black text-slate-900">
                        Grand Total
                    </span>

                    <span className="text-xl font-black text-emerald-600">
                        {formatCurrency(
                            checkout?.grand_total,
                        )}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={
                    onPlaceOrder
                }
                disabled={
                    processing
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-white" />
                        Membuat Pesanan...
                    </>
                ) : (
                    <>
                        <Icon
                            name="check"
                            className="h-5 w-5"
                        />
                        Buat Pesanan
                    </>
                )}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Stok akan dikurangi setelah pesanan berhasil dibuat.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
                <Icon
                    name="shield"
                    className="h-4 w-4 text-emerald-600"
                />

                Checkout aman NexCommerce
            </div>
        </aside>
    );
}

function SummaryRow({
    label,
    value,
    valueClassName =
    'text-slate-900',
}) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-500">
                {label}
            </span>

            <span className={`text-right font-black ${valueClassName}`}>
                {value}
            </span>
        </div>
    );
}

function calculateTotalSavings(
    checkout,
) {
    const vendorGroups =
        Array.isArray(
            checkout?.vendors,
        )
            ? checkout.vendors
            : [];

    return vendorGroups.reduce(
        (
            vendorTotal,
            vendorGroup,
        ) => {
            const items =
                Array.isArray(
                    vendorGroup?.items,
                )
                    ? vendorGroup.items
                    : [];

            return (
                vendorTotal +
                items.reduce(
                    (
                        itemTotal,
                        item,
                    ) => {
                        const quantity =
                            Number(
                                item?.quantity ??
                                0,
                            );

                        const finalPrice =
                            Number(
                                item?.final_unit_price ??
                                item?.price ??
                                0,
                            );

                        const originalPrice =
                            Number(
                                item?.original_unit_price ??
                                item?.original_price ??
                                item?.sku
                                    ?.original_price ??
                                finalPrice,
                            );

                        const fallbackSaving =
                            Math.max(
                                0,
                                originalPrice -
                                finalPrice,
                            ) *
                            quantity;

                        return (
                            itemTotal +
                            Number(
                                item?.discount_amount ??
                                fallbackSaving,
                            )
                        );
                    },
                    0,
                )
            );
        },
        0,
    );
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
            {
                maximumFractionDigits:
                    0,
            },
        )
        : '0'}`;
}

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
        arrowLeft: (
            <>
                <path d="M19 12H5" />
                <path d="m10 17-5-5 5-5" />
            </>
        ),
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
            </>
        ),
        receipt: (
            <>
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                <path d="M9 8h6" />
                <path d="M9 12h6" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        check: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="m8 12 2.5 2.5L16 9" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.receipt}
        </svg>
    );
}