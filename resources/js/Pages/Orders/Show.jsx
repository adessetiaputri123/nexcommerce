import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import {
    useEffect,
    useState,
} from 'react';

export default function Show({
    order,
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const [
        processingPayment,
        setProcessingPayment,
    ] = useState(false);

    const [
        remainingSeconds,
        setRemainingSeconds,
    ] = useState(() =>
        calculateRemainingSeconds(
            order,
        ),
    );

    useEffect(() => {
        setRemainingSeconds(
            calculateRemainingSeconds(
                order,
            ),
        );

        if (
            order.payment_status !==
            'unpaid' ||
            !order.expires_at
        ) {
            return undefined;
        }

        const timer =
            window.setInterval(() => {
                setRemainingSeconds(
                    calculateRemainingSeconds(
                        order,
                    ),
                );
            }, 1000);

        return () => {
            window.clearInterval(
                timer,
            );
        };
    }, [
        order.id,
        order.expires_at,
        order.payment_status,
    ]);

    useEffect(() => {
        if (
            order.payment_status !==
            'unpaid' ||
            remainingSeconds > 0
        ) {
            return undefined;
        }

        const reloadTimer =
            window.setTimeout(() => {
                router.reload({
                    only: [
                        'order',
                    ],
                    preserveScroll:
                        true,
                });
            }, 15000);

        return () => {
            window.clearTimeout(
                reloadTimer,
            );
        };
    }, [
        order.id,
        order.payment_status,
        remainingSeconds,
    ]);

    const payOrder = () => {
        const confirmed =
            window.confirm(
                `Bayar pesanan #${order.id} sekarang?`,
            );

        if (!confirmed) {
            return;
        }

        router.post(
            route(
                'orders.pay',
                order.id,
            ),
            {},
            {
                preserveScroll:
                    true,

                onStart: () => {
                    setProcessingPayment(
                        true,
                    );
                },

                onFinish: () => {
                    setProcessingPayment(
                        false,
                    );
                },
            },
        );
    };

    const paymentExpired =
        order.payment_status ===
        'expired' ||
        order.is_payment_expired;

    const vendorOrders =
        Array.isArray(
            order.vendor_orders,
        )
            ? order.vendor_orders
            : [];

    return (
        <AuthenticatedLayout>
            <Head
                title={`Pesanan #${order.id}`}
            />

            <div className="space-y-6">
                <PageHeader
                    order={order}
                />

                <Feedback
                    flash={flash}
                    errors={errors}
                />

                <PaymentNotice
                    order={order}
                    paymentExpired={
                        paymentExpired
                    }
                    remainingSeconds={
                        remainingSeconds
                    }
                    processingPayment={
                        processingPayment
                    }
                    onPay={payOrder}
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        {vendorOrders.map(
                            (
                                vendorOrder,
                            ) => (
                                <VendorOrderSection
                                    key={
                                        vendorOrder.id
                                    }
                                    vendorOrder={
                                        vendorOrder
                                    }
                                />
                            ),
                        )}
                    </div>

                    <OrderSummary
                        order={order}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({
    order,
}) {
    const paymentStatus =
        getPaymentStatus(
            order.payment_status,
        );

    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Detail transaksi
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Pesanan #
                        {
                            order.id
                        }
                    </h1>

                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${paymentStatus.className}`}
                    >
                        {
                            paymentStatus.label
                        }
                    </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                    Dibuat{' '}
                    {formatDate(
                        order.created_at,
                    )}
                </p>
            </div>

            <Link
                href={
                    route(
                        'orders.index',
                    )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
                <Icon
                    name="arrowLeft"
                    className="h-4 w-4"
                />

                Kembali ke Pesanan
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
        errors?.payment ??
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

function PaymentNotice({
    order,
    paymentExpired,
    remainingSeconds,
    processingPayment,
    onPay,
}) {
    if (
        order.payment_status ===
        'paid'
    ) {
        return (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Icon
                            name="check"
                            className="h-6 w-6"
                        />
                    </span>

                    <div>
                        <h2 className="font-black text-emerald-900">
                            Pembayaran berhasil
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                            Pesanan telah dibayar dan diteruskan kepada vendor.
                        </p>

                        {order.payment_reference && (
                            <p className="mt-2 font-mono text-xs font-bold text-emerald-700">
                                Referensi:{' '}
                                {
                                    order.payment_reference
                                }
                            </p>
                        )}

                        {order.paid_at && (
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                                Dibayar{' '}
                                {formatDate(
                                    order.paid_at,
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    if (
        order.payment_status ===
        'expired'
    ) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                        <Icon
                            name="clock"
                            className="h-6 w-6"
                        />
                    </span>

                    <div>
                        <h2 className="font-black text-slate-900">
                            Pesanan kedaluwarsa
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Batas pembayaran telah berakhir dan stok produk sudah dikembalikan.
                        </p>

                        {order.expired_at && (
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                                Diproses{' '}
                                {formatDate(
                                    order.expired_at,
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    if (
        order.payment_status !==
        'unpaid'
    ) {
        return null;
    }

    return (
        <section
            className={`rounded-2xl border p-5 shadow-sm ${paymentExpired
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${paymentExpired
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                    >
                        <Icon
                            name="clock"
                            className="h-6 w-6"
                        />
                    </span>

                    <div>
                        <h2
                            className={`font-black ${paymentExpired
                                    ? 'text-red-900'
                                    : 'text-amber-900'
                                }`}
                        >
                            {paymentExpired
                                ? 'Batas pembayaran telah berakhir'
                                : 'Selesaikan pembayaran'}
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Batas waktu:{' '}
                            {order.expires_at
                                ? formatDate(
                                    order.expires_at,
                                )
                                : 'Belum tersedia'}
                        </p>

                        {paymentExpired && (
                            <p className="mt-2 text-xs font-bold text-red-700">
                                Sistem sedang memperbarui status pesanan dan mengembalikan stok.
                            </p>
                        )}
                    </div>
                </div>

                <div className="sm:text-right">
                    {order.expires_at && (
                        <>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                Sisa waktu
                            </p>

                            <p
                                className={`mt-1 font-mono text-3xl font-black ${paymentExpired
                                        ? 'text-red-600'
                                        : 'text-amber-600'
                                    }`}
                            >
                                {paymentExpired
                                    ? '00:00:00'
                                    : formatCountdown(
                                        remainingSeconds,
                                    )}
                            </p>
                        </>
                    )}

                    {!paymentExpired &&
                        remainingSeconds >
                        0 && (
                            <button
                                type="button"
                                onClick={onPay}
                                disabled={
                                    processingPayment
                                }
                                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processingPayment ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-white" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            name="wallet"
                                            className="h-5 w-5"
                                        />
                                        Bayar Sekarang
                                    </>
                                )}
                            </button>
                        )}
                </div>
            </div>
        </section>
    );
}

function VendorOrderSection({
    vendorOrder,
}) {
    const items =
        Array.isArray(
            vendorOrder.items,
        )
            ? vendorOrder.items
            : [];

    const deliveryStatus =
        getDeliveryStatus(
            vendorOrder.delivery_status,
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                            <Icon
                                name="store"
                                className="h-5 w-5"
                            />
                        </span>

                        <div>
                            <h2 className="font-black text-slate-900">
                                {vendorOrder.vendor
                                    ?.shop_name ??
                                    'Vendor'}
                            </h2>

                            <p className="text-xs font-semibold text-slate-500">
                                {
                                    items.length
                                }{' '}
                                produk
                            </p>
                        </div>
                    </div>

                    <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${deliveryStatus.className}`}
                    >
                        {
                            deliveryStatus.label
                        }
                    </span>
                </div>

                <DeliveryTimeline
                    status={
                        vendorOrder.delivery_status
                    }
                />
            </header>

            <div className="divide-y divide-slate-100">
                {items.map(
                    (item) => (
                        <OrderProductItem
                            key={
                                item.id
                            }
                            item={item}
                        />
                    ),
                )}
            </div>

            <footer className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <div className="space-y-3 text-sm">
                    {vendorOrder.has_discount && (
                        <>
                            <SummaryRow
                                label="Harga produk"
                                value={formatCurrency(
                                    vendorOrder.original_subtotal,
                                )}
                            />

                            <SummaryRow
                                label="Diskon promo"
                                value={`-${formatCurrency(
                                    vendorOrder.discount_total,
                                )}`}
                                valueClassName="text-red-600"
                            />
                        </>
                    )}

                    <SummaryRow
                        label="Subtotal produk"
                        value={formatCurrency(
                            vendorOrder.subtotal,
                        )}
                    />

                    <SummaryRow
                        label="Pengiriman"
                        value={formatCurrency(
                            vendorOrder.shipping_cost,
                        )}
                    />

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="font-black text-slate-900">
                            Total toko
                        </span>

                        <span className="text-lg font-black text-emerald-700">
                            {formatCurrency(
                                vendorOrder.total ??
                                Number(
                                    vendorOrder.subtotal,
                                ) +
                                Number(
                                    vendorOrder.shipping_cost,
                                ),
                            )}
                        </span>
                    </div>
                </div>
            </footer>
        </section>
    );
}

function DeliveryTimeline({
    status,
}) {
    const steps = [
        {
            key: 'pending',
            label: 'Menunggu',
        },
        {
            key: 'processing',
            label: 'Diproses',
        },
        {
            key: 'shipped',
            label: 'Dikirim',
        },
        {
            key: 'delivered',
            label: 'Selesai',
        },
    ];

    const statusIndex =
        steps.findIndex(
            (step) =>
                step.key === status,
        );

    const cancelled =
        status === 'cancelled';

    return (
        <div className="mt-4 overflow-x-auto pb-1">
            <div className="flex min-w-[520px] items-center">
                {steps.map(
                    (
                        step,
                        index,
                    ) => {
                        const reached =
                            !cancelled &&
                            statusIndex >=
                            index;

                        return (
                            <div
                                key={
                                    step.key
                                }
                                className="flex flex-1 items-center"
                            >
                                <div className="flex flex-col items-center">
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-black ${reached
                                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                                : cancelled
                                                    ? 'border-red-200 bg-red-50 text-red-500'
                                                    : 'border-slate-300 bg-white text-slate-400'
                                            }`}
                                    >
                                        {index +
                                            1}
                                    </span>

                                    <span
                                        className={`mt-1 text-[10px] font-bold ${reached
                                                ? 'text-emerald-700'
                                                : cancelled
                                                    ? 'text-red-500'
                                                    : 'text-slate-400'
                                            }`}
                                    >
                                        {
                                            step.label
                                        }
                                    </span>
                                </div>

                                {index <
                                    steps.length -
                                    1 && (
                                        <span
                                            className={`mx-2 h-0.5 flex-1 ${!cancelled &&
                                                    statusIndex >
                                                    index
                                                    ? 'bg-emerald-500'
                                                    : cancelled
                                                        ? 'bg-red-100'
                                                        : 'bg-slate-200'
                                                }`}
                                        />
                                    )}
                            </div>
                        );
                    },
                )}
            </div>

            {cancelled && (
                <p className="mt-2 text-xs font-black text-red-600">
                    Pesanan toko dibatalkan.
                </p>
            )}
        </div>
    );
}

function OrderProductItem({
    item,
}) {
    const hasDiscount =
        Boolean(
            item.has_discount,
        );

    const promoText =
        promotionLabel(
            item.promotion,
        );

    const imageUrl =
        item.image_url ??
        item.product
            ?.primary_image
            ?.image_url ??
        item.product
            ?.primaryImage
            ?.image_url ??
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
                                item.product_name ??
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
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="line-clamp-2 font-black leading-6 text-slate-900">
                                    {
                                        item.product_name
                                    }
                                </h3>

                                {hasDiscount &&
                                    promoText && (
                                        <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                            {
                                                promoText
                                            }
                                        </span>
                                    )}
                            </div>

                            <p className="mt-1 font-mono text-xs font-semibold text-slate-400">
                                SKU{' '}
                                {
                                    item.sku
                                }
                            </p>

                            {item.promotion
                                ?.name && (
                                    <p className="mt-2 inline-flex max-w-full rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                                        <span className="truncate">
                                            {
                                                item.promotion.name
                                            }
                                        </span>
                                    </p>
                                )}
                        </div>

                        <div className="sm:text-right">
                            {hasDiscount && (
                                <p className="text-xs font-semibold text-slate-400 line-through">
                                    {formatCurrency(
                                        item.original_total,
                                    )}
                                </p>
                            )}

                            <p className="mt-1 text-lg font-black text-slate-900">
                                {formatCurrency(
                                    item.final_total ??
                                    Number(
                                        item.price,
                                    ) *
                                    Number(
                                        item.quantity,
                                    ),
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-500">
                            {
                                item.quantity
                            }{' '}
                            ×
                        </span>

                        {hasDiscount && (
                            <span className="font-semibold text-slate-400 line-through">
                                {formatCurrency(
                                    item.original_price,
                                )}
                            </span>
                        )}

                        <span
                            className={`font-black ${hasDiscount
                                    ? 'text-red-600'
                                    : 'text-emerald-700'
                                }`}
                        >
                            {formatCurrency(
                                item.final_price ??
                                item.price,
                            )}
                        </span>
                    </div>

                    {hasDiscount && (
                        <p className="mt-2 text-xs font-black text-emerald-600">
                            Hemat{' '}
                            {formatCurrency(
                                item.discount_total,
                            )}{' '}
                            untuk item ini
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

function OrderSummary({
    order,
}) {
    const paymentStatus =
        getPaymentStatus(
            order.payment_status,
        );

    return (
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Icon
                        name="receipt"
                        className="h-6 w-6"
                    />
                </span>

                <div>
                    <h2 className="text-lg font-black text-slate-900">
                        Ringkasan Pembayaran
                    </h2>

                    <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${paymentStatus.className}`}
                    >
                        {
                            paymentStatus.label
                        }
                    </span>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {order.has_discount && (
                    <SummaryRow
                        label="Harga sebelum promo"
                        value={formatCurrency(
                            order.original_product_subtotal,
                        )}
                    />
                )}

                {order.has_discount && (
                    <SummaryRow
                        label="Diskon promo"
                        value={`-${formatCurrency(
                            order.discount_total,
                        )}`}
                        valueClassName="text-red-600"
                    />
                )}

                <SummaryRow
                    label="Subtotal produk"
                    value={formatCurrency(
                        order.product_subtotal ??
                        order.grand_total,
                    )}
                />

                <SummaryRow
                    label="Total pengiriman"
                    value={formatCurrency(
                        order.shipping_total ??
                        0,
                    )}
                />

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="font-black text-slate-900">
                        Grand Total
                    </span>

                    <span className="text-xl font-black text-emerald-600">
                        {formatCurrency(
                            order.grand_total,
                        )}
                    </span>
                </div>
            </div>

            {order.has_discount && (
                <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700">
                    Kamu menghemat{' '}
                    {formatCurrency(
                        order.discount_total,
                    )}
                </div>
            )}

            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                <div className="flex items-center gap-2">
                    <Icon
                        name="shield"
                        className="h-4 w-4 shrink-0 text-emerald-600"
                    />

                    Transaksi tercatat aman di NexCommerce
                </div>
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

            <span
                className={`text-right font-black ${valueClassName}`}
            >
                {value}
            </span>
        </div>
    );
}

function calculateRemainingSeconds(
    order,
) {
    if (
        !order.expires_at ||
        order.payment_status !==
        'unpaid'
    ) {
        return 0;
    }

    const expirationTime =
        parseDateTime(
            order.expires_at,
        );

    if (
        expirationTime ===
        null
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(
            (
                expirationTime -
                Date.now()
            ) / 1000,
        ),
    );
}

function formatCountdown(
    totalSeconds,
) {
    const safeSeconds =
        Math.max(
            0,
            Number(
                totalSeconds,
            ) || 0,
        );

    const hours =
        Math.floor(
            safeSeconds / 3600,
        );

    const minutes =
        Math.floor(
            (
                safeSeconds %
                3600
            ) / 60,
        );

    const seconds =
        safeSeconds % 60;

    return [
        hours,
        minutes,
        seconds,
    ]
        .map((value) =>
            String(
                value,
            ).padStart(
                2,
                '0',
            ),
        )
        .join(':');
}

function promotionLabel(
    promotion,
) {
    if (!promotion) {
        return null;
    }

    const discountValue =
        Number(
            promotion.discount_value ??
            0,
        );

    if (
        promotion.discount_type ===
        'percentage' &&
        discountValue >
        0
    ) {
        return `${discountValue.toLocaleString(
            'id-ID',
        )}% OFF`;
    }

    if (
        promotion.discount_type ===
        'fixed' &&
        discountValue >
        0
    ) {
        return `Potongan ${formatCurrency(
            discountValue,
        )}`;
    }

    return (
        promotion.name ??
        'Promo'
    );
}

function getPaymentStatus(
    status,
) {
    const statuses = {
        unpaid: {
            label:
                'Belum Dibayar',
            className:
                'bg-amber-100 text-amber-700',
        },
        pending: {
            label:
                'Menunggu Konfirmasi',
            className:
                'bg-blue-100 text-blue-700',
        },
        paid: {
            label:
                'Sudah Dibayar',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        failed: {
            label:
                'Pembayaran Gagal',
            className:
                'bg-red-100 text-red-700',
        },
        expired: {
            label:
                'Kedaluwarsa',
            className:
                'bg-slate-200 text-slate-700',
        },
        refunded: {
            label:
                'Dana Dikembalikan',
            className:
                'bg-violet-100 text-violet-700',
        },
    };

    return statuses[status] ?? {
        label:
            status ??
            'Tidak diketahui',
        className:
            'bg-slate-100 text-slate-700',
    };
}

function getDeliveryStatus(
    status,
) {
    const statuses = {
        pending: {
            label:
                'Menunggu Diproses',
            className:
                'bg-amber-100 text-amber-700',
        },
        confirmed: {
            label:
                'Dikonfirmasi',
            className:
                'bg-blue-100 text-blue-700',
        },
        processing: {
            label:
                'Sedang Diproses',
            className:
                'bg-indigo-100 text-indigo-700',
        },
        packed: {
            label:
                'Dikemas',
            className:
                'bg-violet-100 text-violet-700',
        },
        shipped: {
            label:
                'Dikirim',
            className:
                'bg-cyan-100 text-cyan-700',
        },
        delivered: {
            label:
                'Selesai',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        completed: {
            label:
                'Selesai',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        cancelled: {
            label:
                'Dibatalkan',
            className:
                'bg-red-100 text-red-700',
        },
    };

    return statuses[status] ?? {
        label:
            status ??
            '-',
        className:
            'bg-slate-100 text-slate-700',
    };
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

function parseDateTime(
    value,
) {
    if (!value) {
        return null;
    }

    const normalized =
        String(
            value,
        ).trim();

    const localWitaMatch =
        normalized.match(
            /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/,
        );

    const parseValue =
        localWitaMatch
            ? `${localWitaMatch[1]}-${localWitaMatch[2]}-${localWitaMatch[3]}T${localWitaMatch[4]}:${localWitaMatch[5]}:${localWitaMatch[6] ?? '00'}+08:00`
            : normalized;

    const timestamp =
        Date.parse(
            parseValue,
        );

    return Number.isNaN(
        timestamp,
    )
        ? null
        : timestamp;
}

function formatDate(
    value,
) {
    const timestamp =
        parseDateTime(
            value,
        );

    if (
        timestamp ===
        null
    ) {
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
    ).format(
        new Date(
            timestamp,
        ),
    )} WITA`;
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
        clock: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="M12 7v5l3 2" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6Z" />
                <path d="M4 6V4h12" />
                <path d="M16 11h4" />
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
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.receipt}
        </svg>
    );
}