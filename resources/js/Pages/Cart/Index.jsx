import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import {
    useMemo,
    useState,
} from 'react';

export default function Index({
    cart = {},
}) {
    const {
        flash,
        errors,
    } = usePage().props;

    const [
        processingItemId,
        setProcessingItemId,
    ] = useState(null);

    const cartItems =
        Array.isArray(
            cart?.items,
        )
            ? cart.items
            : [];

    const vendorGroups =
        useMemo(() => {
            const groups =
                cartItems.reduce(
                    (
                        result,
                        item,
                    ) => {
                        const vendorKey =
                            item.vendor
                                ?.id ??
                            'unavailable';

                        if (
                            !result[
                            vendorKey
                            ]
                        ) {
                            result[
                                vendorKey
                            ] = {
                                vendor:
                                    item.vendor,
                                items: [],
                            };
                        }

                        result[
                            vendorKey
                        ].items.push(
                            item,
                        );

                        return result;
                    },
                    {},
                );

            return Object.values(
                groups,
            );
        }, [
            cartItems,
        ]);

    const itemCount =
        Number(
            cart?.item_count ??
            cartItems.reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    Number(
                        item.quantity ??
                        0,
                    ),
                0,
            ),
        );

    const subtotal =
        Number(
            cart?.subtotal ??
            cartItems.reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    Number(
                        item.subtotal ??
                        0,
                    ),
                0,
            ),
        );

    const unavailableItems =
        cartItems.filter(
            (item) =>
                !item.available,
        ).length;

    const updateQuantity = (
        item,
        quantity,
    ) => {
        if (
            quantity < 1 ||
            processingItemId !==
            null
        ) {
            return;
        }

        router.patch(
            route(
                'cart.items.update',
                item.id,
            ),
            {
                quantity,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessingItemId(
                        item.id,
                    );
                },

                onFinish: () => {
                    setProcessingItemId(
                        null,
                    );
                },
            },
        );
    };

    const removeItem = (
        item,
    ) => {
        const confirmed =
            window.confirm(
                `Hapus "${item.product?.name ?? 'produk'}" dari keranjang?`,
            );

        if (!confirmed) {
            return;
        }

        router.delete(
            route(
                'cart.items.destroy',
                item.id,
            ),
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessingItemId(
                        item.id,
                    );
                },

                onFinish: () => {
                    setProcessingItemId(
                        null,
                    );
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Keranjang Belanja" />

            <div className="space-y-6">
                <PageHeader
                    itemCount={
                        itemCount
                    }
                />

                <Feedback
                    flash={flash}
                    errors={
                        errors
                    }
                />

                {cartItems.length ===
                    0 ? (
                    <EmptyCart />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-5">
                            {vendorGroups.map(
                                (
                                    group,
                                ) => (
                                    <VendorCartGroup
                                        key={
                                            group.vendor
                                                ?.id ??
                                            'unavailable'
                                        }
                                        group={
                                            group
                                        }
                                        processingItemId={
                                            processingItemId
                                        }
                                        onUpdateQuantity={
                                            updateQuantity
                                        }
                                        onRemoveItem={
                                            removeItem
                                        }
                                    />
                                ),
                            )}
                        </div>

                        <CartSummary
                            itemCount={
                                itemCount
                            }
                            subtotal={
                                subtotal
                            }
                            unavailableItems={
                                unavailableItems
                            }
                        />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({
    itemCount,
}) {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                    Belanja
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Keranjang Belanja
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    {itemCount}{' '}
                    barang siap diperiksa sebelum checkout.
                </p>
            </div>

            <Link
                href={
                    route(
                        'catalog',
                    )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
                <Icon
                    name="arrowLeft"
                    className="h-4 w-4"
                />

                Lanjut Belanja
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
        errors?.quantity ??
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

function EmptyCart() {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon
                    name="cart"
                    className="h-10 w-10"
                />
            </span>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
                Keranjang masih kosong
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tambahkan produk dari katalog untuk mulai berbelanja di NexCommerce.
            </p>

            <Link
                href={
                    route(
                        'catalog',
                    )
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
                <Icon
                    name="store"
                    className="h-5 w-5"
                />

                Lihat Katalog
            </Link>
        </section>
    );
}

function VendorCartGroup({
    group,
    processingItemId,
    onUpdateQuantity,
    onRemoveItem,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon
                        name="store"
                        className="h-5 w-5"
                    />
                </span>

                <div className="min-w-0">
                    <p className="truncate font-black text-slate-900">
                        {group.vendor
                            ?.shop_name ??
                            'Produk Tidak Tersedia'}
                    </p>

                    <p className="text-xs font-semibold text-slate-500">
                        {
                            group.items.length
                        }{' '}
                        jenis produk
                    </p>
                </div>
            </header>

            <div className="divide-y divide-slate-100">
                {group.items.map(
                    (item) => (
                        <CartItem
                            key={
                                item.id
                            }
                            item={
                                item
                            }
                            processing={
                                processingItemId ===
                                item.id
                            }
                            onUpdateQuantity={
                                onUpdateQuantity
                            }
                            onRemoveItem={
                                onRemoveItem
                            }
                        />
                    ),
                )}
            </div>
        </section>
    );
}

function CartItem({
    item,
    processing,
    onUpdateQuantity,
    onRemoveItem,
}) {
    const quantity =
        Number(
            item.quantity ??
            1,
        );

    const stock =
        Number(
            item.sku
                ?.stock ??
            0,
        );

    const snapshotPrice =
        Number(
            item.price_snapshot ??
            0,
        );

    const currentPrice =
        Number(
            item.sku
                ?.current_price ??
            snapshotPrice,
        );

    const originalPrice =
        Number(
            item.original_price ??
            item.sku
                ?.original_price ??
            currentPrice,
        );

    const hasDiscount =
        originalPrice >
        snapshotPrice;

    const priceChanged =
        item.sku &&
        currentPrice !==
        snapshotPrice;

    const imageUrl =
        item.product
            ?.primary_image
            ?.image_url ??
        item.product
            ?.primaryImage
            ?.image_url ??
        item.product
            ?.primary_image_url ??
        item.product
            ?.images?.[0]
            ?.image_url ??
        null;

    const skuCode =
        item.sku?.code ??
        item.sku?.sku ??
        '-';

    return (
        <article className={`p-4 sm:p-5 ${!item.available ? 'bg-red-50/40' : ''}`}>
            <div className="flex gap-4">
                <Link
                    href={
                        item.product
                            ?.id
                            ? route(
                                'products.show',
                                item.product.id,
                            )
                            : '#'
                    }
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-28"
                >
                    {imageUrl ? (
                        <img
                            src={
                                imageUrl
                            }
                            alt={
                                item.product
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
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <Link
                                href={
                                    item.product
                                        ?.id
                                        ? route(
                                            'products.show',
                                            item.product.id,
                                        )
                                        : '#'
                                }
                                className="line-clamp-2 font-black leading-6 text-slate-900 hover:text-emerald-700"
                            >
                                {item.product
                                    ?.name ??
                                    'Produk tidak tersedia'}
                            </Link>

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
                                    item.subtotal,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {hasDiscount && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                                {formatCurrency(
                                    originalPrice,
                                )}
                            </span>
                        )}

                        <span className={`text-sm font-black ${hasDiscount ? 'text-red-600' : 'text-emerald-700'}`}>
                            {formatCurrency(
                                snapshotPrice,
                            )}
                        </span>

                        {hasDiscount && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                                Harga promo
                            </span>
                        )}
                    </div>

                    {priceChanged && (
                        <p className="mt-2 text-xs font-bold text-amber-600">
                            Harga saat ini:{' '}
                            {formatCurrency(
                                currentPrice,
                            )}
                        </p>
                    )}

                    {!item.available && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-red-600">
                            <Icon
                                name="warning"
                                className="h-4 w-4"
                            />

                            Produk tidak tersedia
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white">
                            <IconButton
                                label="Kurangi jumlah"
                                icon="minus"
                                onClick={() =>
                                    onUpdateQuantity(
                                        item,
                                        quantity -
                                        1,
                                    )
                                }
                                disabled={
                                    processing ||
                                    quantity <=
                                    1 ||
                                    !item.available
                                }
                            />

                            <span className="min-w-12 border-x border-slate-200 px-3 py-2 text-center text-sm font-black text-slate-800">
                                {
                                    quantity
                                }
                            </span>

                            <IconButton
                                label="Tambah jumlah"
                                icon="plus"
                                onClick={() =>
                                    onUpdateQuantity(
                                        item,
                                        quantity +
                                        1,
                                    )
                                }
                                disabled={
                                    processing ||
                                    !item.available ||
                                    quantity >=
                                    stock
                                }
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onRemoveItem(
                                    item,
                                )
                            }
                            disabled={
                                processing
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Hapus ${item.product?.name ?? 'produk'}`}
                            title="Hapus"
                        >
                            {processing ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                            ) : (
                                <Icon
                                    name="trash"
                                    className="h-5 w-5"
                                />
                            )}
                        </button>
                    </div>

                    {item.sku && (
                        <p className="mt-2 text-xs font-semibold text-slate-400">
                            Stok tersedia:{' '}
                            {
                                stock
                            }
                        </p>
                    )}
                </div>
            </div>
        </article>
    );
}

function CartSummary({
    itemCount,
    subtotal,
    unavailableItems,
}) {
    const checkoutDisabled =
        unavailableItems > 0;

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
                        Ringkasan Belanja
                    </h2>

                    <p className="text-xs font-semibold text-slate-500">
                        Periksa pesanan sebelum checkout
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                    <span>
                        Jumlah barang
                    </span>

                    <span className="font-black text-slate-900">
                        {
                            itemCount
                        }
                    </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4">
                    <span className="font-black text-slate-900">
                        Total
                    </span>

                    <span className="text-xl font-black text-emerald-600">
                        {formatCurrency(
                            subtotal,
                        )}
                    </span>
                </div>
            </div>

            {checkoutDisabled && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
                    Hapus atau perbarui{' '}
                    {unavailableItems}{' '}
                    produk yang tidak tersedia sebelum checkout.
                </div>
            )}

            {checkoutDisabled ? (
                <button
                    type="button"
                    disabled
                    className="mt-5 block w-full cursor-not-allowed rounded-xl bg-slate-300 px-5 py-3 text-center text-sm font-black text-white"
                >
                    Checkout Tidak Tersedia
                </button>
            ) : (
                <Link
                    href={
                        route(
                            'checkout.show',
                        )
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-indigo-700"
                >
                    Lanjut Checkout

                    <Icon
                        name="arrowRight"
                        className="h-4 w-4"
                    />
                </Link>
            )}

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Harga dan stok diperiksa kembali sebelum pembayaran.
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

function IconButton({
    label,
    icon,
    onClick,
    disabled,
}) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            disabled={
                disabled
            }
            className="inline-flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={
                label
            }
            title={
                label
            }
        >
            <Icon
                name={icon}
                className="h-4 w-4"
            />
        </button>
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
        cart: (
            <>
                <circle
                    cx="9"
                    cy="20"
                    r="1"
                />
                <circle
                    cx="18"
                    cy="20"
                    r="1"
                />
                <path d="M3 4h2l2.4 10.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L21 8H7" />
            </>
        ),
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        minus: (
            <path d="M5 12h14" />
        ),
        trash: (
            <>
                <path d="M4 7h16" />
                <path d="M9 7V4h6v3" />
                <path d="m7 7 1 14h8l1-14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
            </>
        ),
        warning: (
            <>
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
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
        arrowLeft: (
            <>
                <path d="M19 12H5" />
                <path d="m10 17-5-5 5-5" />
            </>
        ),
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.cart}
        </svg>
    );
}