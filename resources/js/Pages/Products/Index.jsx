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

export default function Index({
    products = [],
}) {
    const {
        auth,
        flash,
        errors,
        cartSummary,
    } = usePage().props;

    const user = auth?.user;
    const permissions =
        auth?.permissions ?? [];

    const cartItemCount =
        cartSummary?.item_count ?? 0;

    const [
        processingSkuId,
        setProcessingSkuId,
    ] = useState(null);

    const [search, setSearch] =
        useState('');

    const [currentTime, setCurrentTime] =
        useState(() => Date.now());

    const reloadedExpiryRef =
        useRef(null);

    const productItems =
        Array.isArray(products)
            ? products
            : products?.data ?? [];

    const canViewProducts =
        user?.role ===
        'vendor_owner' ||
        permissions.includes(
            'products.view',
        );

    const isCustomer =
        user?.role === 'customer';

    const filteredProducts =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return productItems;
            }

            return productItems.filter(
                (product) =>
                    [
                        product.name,
                        product.description,
                        product.vendor
                            ?.shop_name,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                        .includes(keyword),
            );
        }, [
            productItems,
            search,
        ]);


    const nearestPromotionExpiry =
        useMemo(() => {
            const expiryTimes =
                productItems
                    .map(
                        getProductPromotionEndTime,
                    )
                    .filter(
                        (expiryTime) =>
                            expiryTime !== null,
                    );

            if (
                expiryTimes.length === 0
            ) {
                return null;
            }

            return Math.min(
                ...expiryTimes,
            );
        }, [
            productItems,
            currentTime,
        ]);

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
            nearestPromotionExpiry ===
            null
        ) {
            return;
        }

        if (
            currentTime <
            nearestPromotionExpiry
        ) {
            return;
        }

        if (
            reloadedExpiryRef.current ===
            nearestPromotionExpiry
        ) {
            return;
        }

        reloadedExpiryRef.current =
            nearestPromotionExpiry;

        router.reload({
            only: ['products'],
            preserveScroll: true,
        });
    }, [
        currentTime,
        nearestPromotionExpiry,
    ]);

    const addToCart = (sku) => {
        router.post(
            route('cart.items.store'),
            {
                product_sku_id:
                    sku.id,
                quantity: 1,
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessingSkuId(
                        sku.id,
                    );
                },

                onFinish: () => {
                    setProcessingSkuId(
                        null,
                    );
                },
            },
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Head title="Katalog Produk" />

            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
                <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={route(
                            'catalog',
                        )}
                        className="shrink-0 text-xl font-black text-emerald-600 sm:text-2xl"
                    >
                        NexCommerce
                    </Link>

                    <div className="hidden min-w-0 max-w-xl flex-1 sm:block">
                        <input
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
                            placeholder="Cari produk atau toko..."
                            className="w-full rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                        />
                    </div>

                    <nav className="flex shrink-0 items-center gap-2">
                        {user ? (
                            <>
                                {isCustomer && (
                                    <Link
                                        href={route(
                                            'cart.index',
                                        )}
                                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600"
                                    >
                                        <span>
                                            Keranjang
                                        </span>

                                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-black text-amber-700">
                                            {
                                                cartItemCount
                                            }
                                        </span>
                                    </Link>
                                )}

                                <Link
                                    href={route(
                                        'dashboard',
                                    )}
                                    className="hidden rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 md:inline-flex"
                                >
                                    Dashboard
                                </Link>

                                {canViewProducts && (
                                    <Link
                                        href={route(
                                            'vendor.products.index',
                                        )}
                                        className="hidden rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 lg:inline-flex"
                                    >
                                        Kelola Produk
                                    </Link>
                                )}

                                <Link
                                    href={route(
                                        'profile.edit',
                                    )}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700 hover:bg-emerald-200"
                                    title={
                                        user.name ??
                                        'Profil'
                                    }
                                >
                                    {user.name
                                        ?.charAt(0)
                                        ?.toUpperCase() ??
                                        'U'}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={route(
                                        'login',
                                    )}
                                    className="rounded-xl border border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                                >
                                    Login
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
                    </nav>
                </div>

                <div className="border-t border-gray-100 px-4 py-3 sm:hidden">
                    <input
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
                        placeholder="Cari produk atau toko..."
                        className="w-full rounded-xl border-gray-300 bg-gray-50 text-sm shadow-sm focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                    />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {flash?.message && (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                        {flash.message}
                    </div>
                )}

                {(flash?.error ||
                    errors?.error ||
                    errors?.quantity ||
                    errors?.cart ||
                    errors?.product_sku_id) && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                            {flash?.error ??
                                errors?.error ??
                                errors?.quantity ??
                                errors?.cart ??
                                errors?.product_sku_id}
                        </div>
                    )}

                <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-sm sm:p-8">
                    <div className="max-w-2xl">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                            Marketplace Multi-vendor
                        </span>

                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Belanja Hemat di
                            NexCommerce
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-emerald-50 sm:text-base">
                            Temukan produk dari
                            berbagai vendor dengan
                            promo yang aktif secara
                            otomatis.
                        </p>
                    </div>
                </section>

                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            Produk Pilihan
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {
                                filteredProducts.length
                            }{' '}
                            produk ditemukan
                        </p>
                    </div>

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch('')
                            }
                            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {filteredProducts.length ===
                    0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="text-6xl">
                            🔎
                        </div>

                        <h2 className="mt-5 text-xl font-black text-gray-900">
                            Produk tidak ditemukan
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Coba gunakan kata
                            pencarian lain.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                        {filteredProducts.map(
                            (product) => (
                                <ProductCard
                                    key={
                                        product.id
                                    }
                                    product={
                                        product
                                    }
                                    user={user}
                                    isCustomer={
                                        isCustomer
                                    }
                                    processingSkuId={
                                        processingSkuId
                                    }
                                    onAddToCart={
                                        addToCart
                                    }
                                    currentTime={
                                        currentTime
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function ProductCard({
    product,
    user,
    isCustomer,
    processingSkuId,
    onAddToCart,
    currentTime,
}) {
    const pricing =
        product.pricing ?? {};

    const skuItems =
        Array.isArray(product.skus)
            ? product.skus
            : pricing.skus ?? [];

    const firstAvailableSku =
        skuItems.find(
            (sku) =>
                Number(sku.stock) > 0,
        ) ??
        skuItems[0] ??
        null;

    const hasDiscount =
        Boolean(
            pricing.has_discount,
        );

    const lowestOriginalPrice =
        pricing.lowest_original_price ??
        firstAvailableSku
            ?.original_price ??
        firstAvailableSku?.price ??
        0;

    const highestOriginalPrice =
        pricing.highest_original_price ??
        lowestOriginalPrice;

    const lowestFinalPrice =
        pricing.lowest_final_price ??
        firstAvailableSku?.final_price ??
        firstAvailableSku?.price ??
        0;

    const highestFinalPrice =
        pricing.highest_final_price ??
        lowestFinalPrice;

    const maximumDiscountPercentage =
        Number(
            pricing.maximum_discount_percentage ??
            firstAvailableSku
                ?.discount_percentage ??
            0,
        );

    const bestPromotion =
        pricing.best_promotion ??
        firstAvailableSku?.promotion ??
        null;

    const promotionEndTime =
        parseDateTime(
            bestPromotion?.ends_at,
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

    const showCountdown =
        hasDiscount &&
        remainingSeconds !== null &&
        remainingSeconds > 0;

    const totalStock =
        skuItems.reduce(
            (total, sku) =>
                total +
                Number(
                    sku.stock ?? 0,
                ),
            0,
        );

    const imageUrl =
        product.primary_image
            ?.image_url ??
        product.primaryImage
            ?.image_url ??
        product.primary_image_url ??
        product.images?.[0]
            ?.image_url ??
        null;

    return (
        <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <Link
                href={route(
                    'products.show',
                    product.id,
                )}
                className="relative block aspect-square overflow-hidden bg-gray-100"
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-5xl">
                        📦
                    </div>
                )}

                {hasDiscount && (
                    <span className="absolute left-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black text-white shadow sm:text-xs">
                        {Math.round(
                            maximumDiscountPercentage,
                        )}
                        % OFF
                    </span>
                )}

                {totalStock <= 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-800">
                            Stok Habis
                        </span>
                    </div>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-3 sm:p-4">
                <p className="truncate text-xs font-semibold text-gray-500">
                    {product.vendor
                        ?.shop_name ??
                        'NexCommerce Vendor'}
                </p>

                <Link
                    href={route(
                        'products.show',
                        product.id,
                    )}
                    className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-gray-900 hover:text-emerald-600 sm:text-base"
                >
                    {product.name}
                </Link>

                <div className="mt-3">
                    {hasDiscount && (
                        <p className="truncate text-xs text-gray-400 line-through">
                            {formatPriceRange(
                                lowestOriginalPrice,
                                highestOriginalPrice,
                            )}
                        </p>
                    )}

                    <p
                        className={`font-black ${hasDiscount
                            ? 'text-red-600'
                            : 'text-emerald-600'
                            } text-base sm:text-lg`}
                    >
                        {formatPriceRange(
                            lowestFinalPrice,
                            highestFinalPrice,
                        )}
                    </p>

                    {hasDiscount &&
                        bestPromotion?.name && (
                            <span className="mt-2 inline-flex max-w-full rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                                <span className="truncate">
                                    {
                                        bestPromotion.name
                                    }
                                </span>
                            </span>
                        )}

                    {showCountdown && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-bold text-amber-700 sm:text-xs">
                            Berakhir dalam{' '}
                            <span className="font-mono">
                                {formatCountdown(
                                    remainingSeconds,
                                )}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                        Stok {totalStock}
                    </span>

                    <span>
                        {skuItems.length}{' '}
                        varian
                    </span>
                </div>

                <div className="mt-auto pt-4">
                    {!firstAvailableSku ||
                        totalStock <= 0 ? (
                        <button
                            type="button"
                            disabled
                            className="w-full cursor-not-allowed rounded-xl bg-gray-200 px-3 py-2.5 text-xs font-bold text-gray-500 sm:text-sm"
                        >
                            Stok Habis
                        </button>
                    ) : isCustomer ? (
                        <button
                            type="button"
                            onClick={() =>
                                onAddToCart(
                                    firstAvailableSku,
                                )
                            }
                            disabled={
                                processingSkuId ===
                                firstAvailableSku.id
                            }
                            className="w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        >
                            {processingSkuId ===
                                firstAvailableSku.id
                                ? 'Menambahkan...'
                                : '+ Keranjang'}
                        </button>
                    ) : !user ? (
                        <Link
                            href={route(
                                'login',
                            )}
                            className="block w-full rounded-xl border border-emerald-600 px-3 py-2.5 text-center text-xs font-bold text-emerald-700 hover:bg-emerald-50 sm:text-sm"
                        >
                            Login untuk Membeli
                        </Link>
                    ) : (
                        <Link
                            href={route(
                                'products.show',
                                product.id,
                            )}
                            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 sm:text-sm"
                        >
                            Lihat Produk
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}

function formatCurrency(value) {
    const numericValue =
        Number(value ?? 0);

    return `Rp ${numericValue.toLocaleString(
        'id-ID',
        {
            maximumFractionDigits: 0,
        },
    )}`;
}

function formatPriceRange(
    lowest,
    highest,
) {
    const lowestNumber =
        Number(lowest ?? 0);

    const highestNumber =
        Number(highest ?? 0);

    if (
        highestNumber > 0 &&
        highestNumber !==
        lowestNumber
    ) {
        return `${formatCurrency(
            lowestNumber,
        )} - ${formatCurrency(
            highestNumber,
        )}`;
    }

    return formatCurrency(
        lowestNumber,
    );
}

function getProductPromotionEndTime(
    product,
) {
    const pricing =
        product?.pricing ?? {};

    const skuItems =
        Array.isArray(product?.skus)
            ? product.skus
            : pricing.skus ?? [];

    const firstAvailableSku =
        skuItems.find(
            (sku) =>
                Number(sku.stock) > 0,
        ) ??
        skuItems[0] ??
        null;

    const promotion =
        pricing.best_promotion ??
        firstAvailableSku?.promotion ??
        null;

    return parseDateTime(
        promotion?.ends_at,
    );
}

function parseDateTime(value) {
    if (!value) {
        return null;
    }

    const timestamp =
        Date.parse(value);

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
