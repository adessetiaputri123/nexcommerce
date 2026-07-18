import {
    Head,
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

export default function Show({
    product,
}) {
    const {
        auth,
        flash,
        errors,
        cartSummary,
    } = usePage().props;

    const user = auth?.user;

    const isCustomer =
        user?.role === 'customer';

    const images =
        Array.isArray(
            product?.images,
        )
            ? product.images
            : [];

    const pricing =
        product?.pricing ?? {};

    const skus =
        Array.isArray(
            product?.skus,
        )
            ? product.skus
            : Array.isArray(
                pricing?.skus,
            )
                ? pricing.skus
                : [];

    const primaryImageIndex =
        images.findIndex(
            (image) =>
                image.is_primary,
        );

    const [
        activeImageIndex,
        setActiveImageIndex,
    ] = useState(
        primaryImageIndex >= 0
            ? primaryImageIndex
            : 0,
    );

    const firstAvailableSku =
        skus.find(
            (sku) =>
                Number(
                    sku.stock,
                ) > 0,
        ) ??
        skus[0] ??
        null;

    const [
        selectedSkuId,
        setSelectedSkuId,
    ] = useState(
        firstAvailableSku?.id ??
        null,
    );

    const [quantity, setQuantity] =
        useState(1);

    const [
        addingToCart,
        setAddingToCart,
    ] = useState(false);

    const [
        currentTime,
        setCurrentTime,
    ] = useState(
        () => Date.now(),
    );

    const reloadedPromotionRef =
        useRef(null);

    const selectedSku = useMemo(
        () =>
            skus.find(
                (sku) =>
                    Number(sku.id) ===
                    Number(
                        selectedSkuId,
                    ),
            ) ??
            firstAvailableSku ??
            null,
        [
            skus,
            selectedSkuId,
            firstAvailableSku,
        ],
    );

    const activeImage =
        images[
        activeImageIndex
        ] ?? null;

    const selectedStock =
        Number(
            selectedSku?.stock ?? 0,
        );

    const cartItemCount =
        cartSummary?.item_count ??
        0;

    const selectedOriginalPrice =
        Number(
            selectedSku
                ?.original_price ??
            selectedSku?.price ??
            product
                ?.minimum_price ??
            pricing
                ?.lowest_original_price ??
            0,
        );

    const selectedFinalPrice =
        Number(
            selectedSku
                ?.final_price ??
            selectedSku?.price ??
            product
                ?.minimum_final_price ??
            pricing
                ?.lowest_final_price ??
            selectedOriginalPrice,
        );

    const selectedHasDiscount =
        Boolean(
            selectedSku
                ?.has_discount,
        ) &&
        selectedFinalPrice <
        selectedOriginalPrice;

    const selectedDiscountPercentage =
        Number(
            selectedSku
                ?.discount_percentage ??
            0,
        );

    const selectedPromotion =
        selectedSku?.promotion ??
        pricing?.best_promotion ??
        null;

    const promotionEndTime =
        parsePromotionDateTime(
            selectedPromotion?.ends_at,
        );

    const remainingSeconds =
        promotionEndTime === null
            ? null
            : Math.max(
                0,
                Math.floor(
                    (
                        promotionEndTime -
                        currentTime
                    ) / 1000,
                ),
            );

    const promotionReloadKey =
        selectedPromotion?.id &&
            promotionEndTime
            ? `${selectedPromotion.id}:${promotionEndTime}`
            : null;

    const showPromotionCountdown =
        selectedHasDiscount &&
        remainingSeconds !== null &&
        remainingSeconds > 0;

    const originalSubtotal =
        selectedOriginalPrice *
        quantity;

    const finalSubtotal =
        selectedFinalPrice *
        quantity;

    const savedAmount =
        Math.max(
            0,
            originalSubtotal -
            finalSubtotal,
        );

    const formatCurrency = (
        value,
    ) =>
        `Rp ${Number(
            value ?? 0,
        ).toLocaleString(
            'id-ID',
            {
                maximumFractionDigits:
                    0,
            },
        )}`;

    useEffect(() => {
        const timer =
            window.setInterval(() => {
                setCurrentTime(
                    Date.now(),
                );
            }, 1000);

        return () => {
            window.clearInterval(
                timer,
            );
        };
    }, []);

    useEffect(() => {
        if (
            !selectedHasDiscount ||
            remainingSeconds === null ||
            remainingSeconds > 0 ||
            !promotionReloadKey
        ) {
            return;
        }

        if (
            reloadedPromotionRef.current ===
            promotionReloadKey
        ) {
            return;
        }

        reloadedPromotionRef.current =
            promotionReloadKey;

        router.reload({
            only: ['product'],
            preserveScroll: true,
        });
    }, [
        promotionReloadKey,
        remainingSeconds,
        selectedHasDiscount,
    ]);

    const chooseSku = (
        skuId,
    ) => {
        setSelectedSkuId(
            Number(skuId),
        );

        setQuantity(1);
    };

    const previousImage = () => {
        if (
            images.length <= 1
        ) {
            return;
        }

        setActiveImageIndex(
            (current) =>
                current === 0
                    ? images.length -
                    1
                    : current - 1,
        );
    };

    const nextImage = () => {
        if (
            images.length <= 1
        ) {
            return;
        }

        setActiveImageIndex(
            (current) =>
                current ===
                    images.length - 1
                    ? 0
                    : current + 1,
        );
    };

    const decreaseQuantity =
        () => {
            setQuantity(
                (current) =>
                    Math.max(
                        1,
                        current - 1,
                    ),
            );
        };

    const increaseQuantity =
        () => {
            if (
                selectedStock <= 0
            ) {
                return;
            }

            setQuantity(
                (current) =>
                    Math.min(
                        selectedStock,
                        current + 1,
                    ),
            );
        };

    const updateQuantity = (
        event,
    ) => {
        const nextValue =
            Number(
                event.target
                    .value,
            );

        if (
            !Number.isInteger(
                nextValue,
            ) ||
            nextValue < 1
        ) {
            setQuantity(1);

            return;
        }

        setQuantity(
            selectedStock > 0
                ? Math.min(
                    nextValue,
                    selectedStock,
                )
                : 1,
        );
    };

    const addToCart = () => {
        if (
            !isCustomer ||
            !selectedSku ||
            selectedStock <= 0
        ) {
            return;
        }

        router.post(
            route(
                'cart.items.store',
            ),
            {
                product_sku_id:
                    selectedSku.id,

                quantity,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setAddingToCart(
                        true,
                    );
                },

                onSuccess: () => {
                    setQuantity(1);
                },

                onFinish: () => {
                    setAddingToCart(
                        false,
                    );
                },
            },
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head
                title={
                    product?.name ??
                    'Detail Produk'
                }
            />

            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
                <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={route(
                            'catalog',
                        )}
                        className="text-xl font-black text-emerald-600 sm:text-2xl"
                    >
                        NexCommerce
                    </Link>

                    <div className="flex items-center gap-2">
                        {isCustomer && (
                            <Link
                                href={route(
                                    'cart.index',
                                )}
                                className="rounded-xl px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Keranjang

                                {cartItemCount >
                                    0 && (
                                        <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                            {
                                                cartItemCount
                                            }
                                        </span>
                                    )}
                            </Link>
                        )}

                        {user ? (
                            <Link
                                href={route(
                                    'profile.edit',
                                )}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                            >
                                Profil
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route(
                                        'login',
                                    )}
                                    className="rounded-xl px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                    Masuk
                                </Link>

                                {route().has(
                                    'register',
                                ) && (
                                        <Link
                                            href={route(
                                                'register',
                                            )}
                                            className="hidden rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 sm:inline-flex"
                                        >
                                            Daftar
                                        </Link>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {flash?.message && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(flash?.error ||
                    errors?.error ||
                    errors?.quantity ||
                    errors?.product_sku_id ||
                    errors?.cart) && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                            {flash?.error ??
                                errors?.error ??
                                errors?.quantity ??
                                errors?.product_sku_id ??
                                errors?.cart}
                        </div>
                    )}

                <nav className="mb-5 text-sm text-gray-500">
                    <Link
                        href={route(
                            'catalog',
                        )}
                        className="hover:text-emerald-700"
                    >
                        Beranda
                    </Link>

                    <span className="mx-2">
                        /
                    </span>

                    <span className="text-gray-800">
                        {product?.name ??
                            'Produk'}
                    </span>
                </nav>

                <div className="grid gap-8 rounded-3xl bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-8">
                    <section>
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                            {activeImage ? (
                                <img
                                    src={
                                        activeImage.image_url
                                    }
                                    alt={
                                        activeImage.alt_text ??
                                        product?.name ??
                                        'Produk'
                                    }
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                                    <span className="text-7xl">
                                        📦
                                    </span>

                                    <p className="mt-3 font-semibold">
                                        Foto belum tersedia
                                    </p>
                                </div>
                            )}

                            {selectedHasDiscount && (
                                <span className="absolute left-3 top-3 rounded-xl bg-red-600 px-3 py-1.5 text-sm font-black text-white shadow">
                                    {Math.round(
                                        selectedDiscountPercentage,
                                    )}
                                    % OFF
                                </span>
                            )}

                            {images.length >
                                1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={
                                                previousImage
                                            }
                                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow hover:bg-white"
                                        >
                                            ‹
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                nextImage
                                            }
                                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold shadow hover:bg-white"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}
                        </div>

                        {images.length >
                            1 && (
                                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                                    {images.map(
                                        (
                                            image,
                                            index,
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    image.id
                                                }
                                                onClick={() =>
                                                    setActiveImageIndex(
                                                        index,
                                                    )
                                                }
                                                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${activeImageIndex ===
                                                    index
                                                    ? 'border-emerald-600'
                                                    : 'border-gray-200'
                                                    }`}
                                            >
                                                <img
                                                    src={
                                                        image.image_url
                                                    }
                                                    alt={
                                                        image.alt_text ??
                                                        product?.name ??
                                                        'Produk'
                                                    }
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                    </section>

                    <section>
                        <p className="text-sm font-bold text-emerald-600">
                            {product?.vendor
                                ?.shop_name ??
                                'NexCommerce Vendor'}
                        </p>

                        <h1 className="mt-2 text-3xl font-black text-gray-900">
                            {product?.name}
                        </h1>

                        {selectedHasDiscount &&
                            selectedPromotion
                                ?.name && (
                                <div className="mt-4 inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                                    {
                                        selectedPromotion.name
                                    }
                                </div>
                            )}

                        {showPromotionCountdown && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    Promo berakhir dalam
                                </p>

                                <p className="mt-1 font-mono text-2xl font-black text-amber-700">
                                    {formatCountdown(
                                        remainingSeconds,
                                    )}
                                </p>

                                <p className="mt-1 text-xs text-amber-700">
                                    Berakhir{' '}
                                    {formatWitaDateTime(
                                        selectedPromotion
                                            ?.ends_at,
                                    )}
                                </p>
                            </div>
                        )}

                        <div
                            className={`mt-5 rounded-2xl p-5 ${selectedHasDiscount
                                ? 'border border-red-100 bg-red-50'
                                : 'bg-emerald-50'
                                }`}
                        >
                            <p className="text-sm text-gray-500">
                                Harga per unit
                            </p>

                            {selectedHasDiscount && (
                                <p className="mt-2 text-sm text-gray-400 line-through">
                                    {formatCurrency(
                                        selectedOriginalPrice,
                                    )}
                                </p>
                            )}

                            <p
                                className={`mt-1 text-3xl font-black ${selectedHasDiscount
                                    ? 'text-red-600'
                                    : 'text-emerald-700'
                                    }`}
                            >
                                {formatCurrency(
                                    selectedFinalPrice,
                                )}
                            </p>

                            {selectedHasDiscount && (
                                <p className="mt-2 text-sm font-semibold text-red-600">
                                    Hemat{' '}
                                    {formatCurrency(
                                        selectedOriginalPrice -
                                        selectedFinalPrice,
                                    )}{' '}
                                    per item
                                </p>
                            )}
                        </div>

                        <div className="mt-6">
                            <h2 className="font-bold text-gray-900">
                                Pilih Varian
                            </h2>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {skus.map(
                                    (sku) => {
                                        const skuOriginalPrice =
                                            Number(
                                                sku.original_price ??
                                                sku.price ??
                                                0,
                                            );

                                        const skuFinalPrice =
                                            Number(
                                                sku.final_price ??
                                                sku.price ??
                                                0,
                                            );

                                        const skuHasDiscount =
                                            Boolean(
                                                sku.has_discount,
                                            ) &&
                                            skuFinalPrice <
                                            skuOriginalPrice;

                                        const isSelected =
                                            Number(
                                                selectedSkuId,
                                            ) ===
                                            Number(
                                                sku.id,
                                            );

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    sku.id
                                                }
                                                disabled={
                                                    Number(
                                                        sku.stock,
                                                    ) <=
                                                    0
                                                }
                                                onClick={() =>
                                                    chooseSku(
                                                        sku.id,
                                                    )
                                                }
                                                className={`rounded-xl border p-4 text-left transition ${isSelected
                                                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                                                    : 'border-gray-300 bg-white hover:border-emerald-300'
                                                    } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="font-bold">
                                                        {
                                                            sku.sku
                                                        }
                                                    </span>

                                                    {skuHasDiscount && (
                                                        <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-black text-red-600">
                                                            {Math.round(
                                                                Number(
                                                                    sku.discount_percentage ??
                                                                    0,
                                                                ),
                                                            )}
                                                            %
                                                        </span>
                                                    )}
                                                </div>

                                                {skuHasDiscount && (
                                                    <span className="mt-2 block text-xs text-gray-400 line-through">
                                                        {formatCurrency(
                                                            skuOriginalPrice,
                                                        )}
                                                    </span>
                                                )}

                                                <span
                                                    className={`mt-1 block text-sm font-black ${skuHasDiscount
                                                        ? 'text-red-600'
                                                        : 'text-emerald-700'
                                                        }`}
                                                >
                                                    {formatCurrency(
                                                        skuFinalPrice,
                                                    )}
                                                </span>

                                                <span className="mt-1 block text-xs text-gray-500">
                                                    Stok{' '}
                                                    {
                                                        sku.stock
                                                    }
                                                </span>
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                            <p className="text-sm font-semibold text-gray-600">
                                Jumlah
                            </p>

                            <div className="mt-2 flex items-center">
                                <button
                                    type="button"
                                    onClick={
                                        decreaseQuantity
                                    }
                                    disabled={
                                        quantity <=
                                        1
                                    }
                                    className="h-11 w-11 rounded-l-xl border border-gray-300 bg-white text-xl font-bold disabled:opacity-40"
                                >
                                    −
                                </button>

                                <input
                                    type="number"
                                    min="1"
                                    max={
                                        selectedStock >
                                            0
                                            ? selectedStock
                                            : 1
                                    }
                                    value={
                                        quantity
                                    }
                                    onChange={
                                        updateQuantity
                                    }
                                    className="h-11 w-20 border-y border-gray-300 text-center font-bold"
                                />

                                <button
                                    type="button"
                                    onClick={
                                        increaseQuantity
                                    }
                                    disabled={
                                        selectedStock <=
                                        0 ||
                                        quantity >=
                                        selectedStock
                                    }
                                    className="h-11 w-11 rounded-r-xl border border-gray-300 bg-white text-xl font-bold disabled:opacity-40"
                                >
                                    +
                                </button>
                            </div>

                            <p className="mt-2 text-xs text-gray-500">
                                Stok tersedia:{' '}
                                {selectedStock}
                            </p>

                            <div className="mt-5 rounded-xl bg-white p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-gray-500">
                                        Total
                                    </span>

                                    <div className="text-right">
                                        {selectedHasDiscount && (
                                            <p className="text-xs text-gray-400 line-through">
                                                {formatCurrency(
                                                    originalSubtotal,
                                                )}
                                            </p>
                                        )}

                                        <p
                                            className={`text-xl font-black ${selectedHasDiscount
                                                ? 'text-red-600'
                                                : 'text-emerald-700'
                                                }`}
                                        >
                                            {formatCurrency(
                                                finalSubtotal,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {selectedHasDiscount &&
                                    savedAmount >
                                    0 && (
                                        <p className="mt-2 text-right text-xs font-bold text-red-600">
                                            Total hemat{' '}
                                            {formatCurrency(
                                                savedAmount,
                                            )}
                                        </p>
                                    )}
                            </div>

                            <div className="mt-5">
                                {!user ? (
                                    <Link
                                        href={route(
                                            'login',
                                        )}
                                        className="block w-full rounded-xl bg-emerald-600 px-5 py-3 text-center font-bold text-white hover:bg-emerald-700"
                                    >
                                        Masuk untuk Membeli
                                    </Link>
                                ) : isCustomer ? (
                                    <button
                                        type="button"
                                        onClick={
                                            addToCart
                                        }
                                        disabled={
                                            addingToCart ||
                                            selectedStock <=
                                            0
                                        }
                                        className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                    >
                                        {addingToCart
                                            ? 'Menambahkan...'
                                            : selectedStock <=
                                                0
                                                ? 'Stok Habis'
                                                : `+ Tambah ${quantity} ke Keranjang`}
                                    </button>
                                ) : (
                                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-700">
                                        Hanya akun customer yang dapat membeli.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900">
                        Deskripsi Produk
                    </h2>

                    <p className="mt-4 whitespace-pre-line leading-7 text-gray-700">
                        {product?.description ||
                            'Belum ada deskripsi produk.'}
                    </p>
                </section>
            </main>
        </div>
    );
}

function parsePromotionDateTime(value) {
    if (!value) {
        return null;
    }

    const normalized =
        String(value).trim();

    const localWitaMatch =
        normalized.match(
            /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/,
        );

    const parseValue =
        localWitaMatch
            ? `${localWitaMatch[1]}-${localWitaMatch[2]}-${localWitaMatch[3]}T${localWitaMatch[4]}:${localWitaMatch[5]}:${localWitaMatch[6] ?? '00'}+08:00`
            : normalized;

    const timestamp =
        Date.parse(parseValue);

    return Number.isNaN(timestamp)
        ? null
        : timestamp;
}

function formatCountdown(totalSeconds) {
    const safeSeconds =
        Math.max(
            0,
            Number(totalSeconds) || 0,
        );

    const days =
        Math.floor(
            safeSeconds / 86400,
        );

    const hours =
        Math.floor(
            (
                safeSeconds % 86400
            ) / 3600,
        );

    const minutes =
        Math.floor(
            (
                safeSeconds % 3600
            ) / 60,
        );

    const seconds =
        safeSeconds % 60;

    const clock = [
        hours,
        minutes,
        seconds,
    ]
        .map((value) =>
            String(value).padStart(
                2,
                '0',
            ),
        )
        .join(':');

    return days > 0
        ? `${days} hari ${clock}`
        : clock;
}

function formatWitaDateTime(value) {
    const timestamp =
        parsePromotionDateTime(
            value,
        );

    if (timestamp === null) {
        return '-';
    }

    return `${new Intl.DateTimeFormat(
        'id-ID',
        {
            timeZone: 'Asia/Makassar',
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    ).format(
        new Date(timestamp),
    )} WITA`;
}