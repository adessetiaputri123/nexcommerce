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

const STOCK_FILTERS = [
    {
        value: 'all',
        label: 'Semua Produk',
    },
    {
        value: 'available',
        label: 'Stok Tersedia',
    },
    {
        value: 'low',
        label: 'Stok Menipis',
    },
    {
        value: 'empty',
        label: 'Stok Habis',
    },
];

export default function Manage({
    products = [],
    vendor = null,
}) {
    const {
        auth,
        flash,
        errors,
    } = usePage().props;

    const user =
        auth?.user;

    const permissions =
        Array.isArray(
            auth?.permissions,
        )
            ? auth.permissions
            : [];

    const [
        searchQuery,
        setSearchQuery,
    ] = useState('');

    const [
        stockFilter,
        setStockFilter,
    ] = useState('all');

    const [
        deletingProductId,
        setDeletingProductId,
    ] = useState(null);

    const isVendorOwner =
        user?.role ===
        'vendor_owner';

    const canCreateProduct =
        isVendorOwner ||
        permissions.includes(
            'products.create',
        );

    const canUpdateProduct =
        isVendorOwner ||
        permissions.includes(
            'products.update',
        );

    const canDeleteProduct =
        isVendorOwner ||
        permissions.includes(
            'products.delete',
        );

    const canViewTrash =
        isVendorOwner ||
        permissions.includes(
            'products.view',
        );

    const productItems =
        Array.isArray(
            products,
        )
            ? products
            : Array.isArray(
                products?.data,
            )
                ? products.data
                : [];

    const statistics =
        useMemo(() => {
            return productItems.reduce(
                (
                    result,
                    product,
                ) => {
                    const skus =
                        getSkuItems(
                            product,
                        );

                    const totalStock =
                        getTotalStock(
                            product,
                        );

                    result.totalProducts +=
                        1;

                    result.totalVariants +=
                        skus.length;

                    result.totalStock +=
                        totalStock;

                    if (
                        totalStock <=
                        0
                    ) {
                        result.outOfStock +=
                            1;
                    } else if (
                        totalStock <=
                        5
                    ) {
                        result.lowStock +=
                            1;
                    }

                    return result;
                },
                {
                    totalProducts: 0,
                    totalVariants: 0,
                    totalStock: 0,
                    lowStock: 0,
                    outOfStock: 0,
                },
            );
        }, [
            productItems,
        ]);

    const filteredProducts =
        useMemo(() => {
            const keyword =
                searchQuery
                    .trim()
                    .toLowerCase();

            return productItems.filter(
                (product) => {
                    const skus =
                        getSkuItems(
                            product,
                        );

                    const totalStock =
                        getTotalStock(
                            product,
                        );

                    const matchesSearch =
                        !keyword ||
                        [
                            product.name,
                            product.description,
                            product.category
                                ?.name,
                            ...skus.map(
                                (sku) =>
                                    sku.sku ??
                                    sku.code,
                            ),
                        ]
                            .filter(Boolean)
                            .join(' ')
                            .toLowerCase()
                            .includes(
                                keyword,
                            );

                    const matchesStock =
                        stockFilter ===
                        'all' ||
                        (
                            stockFilter ===
                            'available' &&
                            totalStock >
                            5
                        ) ||
                        (
                            stockFilter ===
                            'low' &&
                            totalStock >
                            0 &&
                            totalStock <=
                            5
                        ) ||
                        (
                            stockFilter ===
                            'empty' &&
                            totalStock <=
                            0
                        );

                    return (
                        matchesSearch &&
                        matchesStock
                    );
                },
            );
        }, [
            productItems,
            searchQuery,
            stockFilter,
        ]);

    const resetFilters =
        () => {
            setSearchQuery('');
            setStockFilter(
                'all',
            );
        };

    const handleDelete = (
        product,
    ) => {
        const confirmed =
            window.confirm(
                `Hapus produk "${product.name}"? Produk akan dipindahkan ke tempat sampah.`,
            );

        if (!confirmed) {
            return;
        }

        router.delete(
            route(
                'vendor.products.destroy',
                product.id,
            ),
            {
                preserveScroll:
                    true,

                onStart: () => {
                    setDeletingProductId(
                        product.id,
                    );
                },

                onFinish: () => {
                    setDeletingProductId(
                        null,
                    );
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Produk" />

            <div className="space-y-6">
                <PageHeader
                    vendor={vendor}
                    canCreateProduct={
                        canCreateProduct
                    }
                    canViewTrash={
                        canViewTrash
                    }
                />

                <Feedback
                    flash={flash}
                    errors={errors}
                />

                <Statistics
                    statistics={
                        statistics
                    }
                />

                {productItems.length >
                    0 ? (
                    <>
                        <ProductFilters
                            searchQuery={
                                searchQuery
                            }
                            stockFilter={
                                stockFilter
                            }
                            resultCount={
                                filteredProducts.length
                            }
                            onSearchChange={
                                setSearchQuery
                            }
                            onStockFilterChange={
                                setStockFilter
                            }
                            onReset={
                                resetFilters
                            }
                        />

                        {filteredProducts.length ===
                            0 ? (
                            <EmptyFilterResult
                                onReset={
                                    resetFilters
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-4 md:hidden">
                                    {filteredProducts.map(
                                        (product) => (
                                            <ProductCard
                                                key={
                                                    product.id
                                                }
                                                product={
                                                    product
                                                }
                                                canUpdateProduct={
                                                    canUpdateProduct
                                                }
                                                canDeleteProduct={
                                                    canDeleteProduct
                                                }
                                                deleting={
                                                    deletingProductId ===
                                                    product.id
                                                }
                                                onDelete={
                                                    handleDelete
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <ProductsTable
                                    products={
                                        filteredProducts
                                    }
                                    canUpdateProduct={
                                        canUpdateProduct
                                    }
                                    canDeleteProduct={
                                        canDeleteProduct
                                    }
                                    deletingProductId={
                                        deletingProductId
                                    }
                                    onDelete={
                                        handleDelete
                                    }
                                />

                                <Pagination
                                    links={
                                        Array.isArray(
                                            products?.links,
                                        )
                                            ? products.links
                                            : []
                                    }
                                />
                            </>
                        )}
                    </>
                ) : (
                    <EmptyProducts
                        canCreateProduct={
                            canCreateProduct
                        }
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({
    vendor,
    canCreateProduct,
    canViewTrash,
}) {
    return (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                        Pusat penjual
                    </p>

                    <h1 className="mt-2 text-3xl font-black tracking-tight">
                        Kelola Produk
                    </h1>

                    <p className="mt-2 text-sm font-bold text-violet-100">
                        {vendor?.shop_name ??
                            'NexCommerce Vendor'}
                    </p>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                        Kelola katalog toko, varian, harga, foto, dan stok produk dari satu halaman.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href={route(
                            'catalog',
                        )}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/20"
                    >
                        <Icon
                            name="store"
                            className="h-5 w-5"
                        />

                        Lihat Katalog
                    </Link>

                    {canViewTrash && (
                        <Link
                            href={route(
                                'vendor.products.trash',
                            )}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/20"
                        >
                            <Icon
                                name="trash"
                                className="h-5 w-5"
                            />

                            Produk Terhapus
                        </Link>
                    )}

                    {canCreateProduct && (
                        <Link
                            href={route(
                                'vendor.products.create',
                            )}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50"
                        >
                            <Icon
                                name="plus"
                                className="h-5 w-5"
                            />

                            Tambah Produk
                        </Link>
                    )}
                </div>
            </div>
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

function Statistics({
    statistics,
}) {
    const cards = [
        {
            label: 'Total Produk',
            value:
                statistics.totalProducts,
            icon: 'box',
            className:
                'bg-indigo-100 text-indigo-700',
        },
        {
            label: 'Total Varian',
            value:
                statistics.totalVariants,
            icon: 'layers',
            className:
                'bg-violet-100 text-violet-700',
        },
        {
            label: 'Total Stok',
            value:
                statistics.totalStock,
            icon: 'warehouse',
            className:
                'bg-emerald-100 text-emerald-700',
        },
        {
            label: 'Stok Menipis',
            value:
                statistics.lowStock,
            icon: 'warning',
            className:
                'bg-amber-100 text-amber-700',
        },
        {
            label: 'Stok Habis',
            value:
                statistics.outOfStock,
            icon: 'alert',
            className:
                'bg-red-100 text-red-700',
        },
    ];

    return (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {cards.map(
                (card) => (
                    <article
                        key={
                            card.label
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                    {
                                        card.label
                                    }
                                </p>

                                <p className="mt-2 text-2xl font-black text-slate-900">
                                    {
                                        card.value
                                    }
                                </p>
                            </div>

                            <span
                                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.className}`}
                            >
                                <Icon
                                    name={
                                        card.icon
                                    }
                                    className="h-5 w-5"
                                />
                            </span>
                        </div>
                    </article>
                ),
            )}
        </section>
    );
}

function ProductFilters({
    searchQuery,
    stockFilter,
    resultCount,
    onSearchChange,
    onStockFilterChange,
    onReset,
}) {
    const hasFilter =
        searchQuery.trim() !==
        '' ||
        stockFilter !== 'all';

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1">
                    <label
                        htmlFor="product-search"
                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                        Cari Produk
                    </label>

                    <div className="relative">
                        <Icon
                            name="search"
                            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            id="product-search"
                            type="search"
                            value={
                                searchQuery
                            }
                            onChange={(event) =>
                                onSearchChange(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Nama produk, kategori, atau SKU..."
                            className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                        />
                    </div>
                </div>

                <div className="lg:w-56">
                    <label
                        htmlFor="stock-filter"
                        className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                        Kondisi Stok
                    </label>

                    <select
                        id="stock-filter"
                        value={
                            stockFilter
                        }
                        onChange={(event) =>
                            onStockFilterChange(
                                event.target
                                    .value,
                            )
                        }
                        className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 text-sm shadow-none focus:border-violet-500 focus:bg-white focus:ring-violet-500"
                    >
                        {STOCK_FILTERS.map(
                            (filter) => (
                                <option
                                    key={
                                        filter.value
                                    }
                                    value={
                                        filter.value
                                    }
                                >
                                    {
                                        filter.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onReset}
                    disabled={
                        !hasFilter
                    }
                    className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Icon
                        name="reset"
                        className="h-4 w-4"
                    />

                    Reset
                </button>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
                {resultCount}{' '}
                produk ditampilkan
            </p>
        </section>
    );
}

function ProductsTable({
    products,
    canUpdateProduct,
    canDeleteProduct,
    deletingProductId,
    onDelete,
}) {
    return (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <TableHeading>
                                Produk
                            </TableHeading>

                            <TableHeading>
                                Harga
                            </TableHeading>

                            <TableHeading align="center">
                                Varian
                            </TableHeading>

                            <TableHeading align="center">
                                Stok
                            </TableHeading>

                            <TableHeading align="right">
                                Aksi
                            </TableHeading>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {products.map(
                            (product) => (
                                <ProductTableRow
                                    key={
                                        product.id
                                    }
                                    product={
                                        product
                                    }
                                    canUpdateProduct={
                                        canUpdateProduct
                                    }
                                    canDeleteProduct={
                                        canDeleteProduct
                                    }
                                    deleting={
                                        deletingProductId ===
                                        product.id
                                    }
                                    onDelete={
                                        onDelete
                                    }
                                />
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function TableHeading({
    children,
    align = 'left',
}) {
    const alignment =
        align === 'right'
            ? 'text-right'
            : align ===
                'center'
                ? 'text-center'
                : 'text-left';

    return (
        <th
            className={`px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 ${alignment}`}
        >
            {children}
        </th>
    );
}

function ProductTableRow({
    product,
    canUpdateProduct,
    canDeleteProduct,
    deleting,
    onDelete,
}) {
    const skus =
        getSkuItems(
            product,
        );

    const totalStock =
        getTotalStock(
            product,
        );

    const stockStatus =
        getStockStatus(
            totalStock,
        );

    return (
        <tr className="align-middle transition hover:bg-slate-50">
            <td className="px-5 py-4">
                <div className="flex items-center gap-4">
                    <ProductImage
                        product={
                            product
                        }
                        sizeClassName="h-16 w-16"
                    />

                    <div className="min-w-0">
                        <Link
                            href={route(
                                'products.show',
                                product.id,
                            )}
                            className="block max-w-sm truncate font-black text-slate-900 hover:text-violet-700"
                        >
                            {
                                product.name
                            }
                        </Link>

                        <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-500">
                            {product.description ||
                                'Tidak ada deskripsi produk.'}
                        </p>

                        <p className="mt-1 max-w-sm truncate font-mono text-xs font-semibold text-slate-400">
                            {skus
                                .map(
                                    (sku) =>
                                        sku.sku ??
                                        sku.code,
                                )
                                .filter(Boolean)
                                .join(', ') ||
                                'Belum ada SKU'}
                        </p>
                    </div>
                </div>
            </td>

            <td className="whitespace-nowrap px-5 py-4 font-black text-violet-700">
                {getPriceLabel(
                    product,
                )}
            </td>

            <td className="px-5 py-4 text-center font-black text-slate-700">
                {
                    skus.length
                }
            </td>

            <td className="px-5 py-4 text-center">
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${stockStatus.className}`}
                >
                    {totalStock}{' '}
                    ·{' '}
                    {
                        stockStatus.label
                    }
                </span>
            </td>

            <td className="px-5 py-4">
                <ProductActions
                    product={
                        product
                    }
                    canUpdateProduct={
                        canUpdateProduct
                    }
                    canDeleteProduct={
                        canDeleteProduct
                    }
                    deleting={
                        deleting
                    }
                    onDelete={
                        onDelete
                    }
                />
            </td>
        </tr>
    );
}

function ProductCard({
    product,
    canUpdateProduct,
    canDeleteProduct,
    deleting,
    onDelete,
}) {
    const skus =
        getSkuItems(
            product,
        );

    const totalStock =
        getTotalStock(
            product,
        );

    const stockStatus =
        getStockStatus(
            totalStock,
        );

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex gap-4 p-4">
                <ProductImage
                    product={
                        product
                    }
                    sizeClassName="h-24 w-24"
                />

                <div className="min-w-0 flex-1">
                    <Link
                        href={route(
                            'products.show',
                            product.id,
                        )}
                        className="line-clamp-2 font-black leading-5 text-slate-900 hover:text-violet-700"
                    >
                        {
                            product.name
                        }
                    </Link>

                    <p className="mt-2 text-sm font-black text-violet-700">
                        {getPriceLabel(
                            product,
                        )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                            {
                                skus.length
                            }{' '}
                            varian
                        </span>

                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-black ${stockStatus.className}`}
                        >
                            Stok{' '}
                            {
                                totalStock
                            }
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 p-3">
                <ProductActions
                    product={
                        product
                    }
                    canUpdateProduct={
                        canUpdateProduct
                    }
                    canDeleteProduct={
                        canDeleteProduct
                    }
                    deleting={
                        deleting
                    }
                    onDelete={
                        onDelete
                    }
                    mobile
                />
            </div>
        </article>
    );
}

function ProductImage({
    product,
    sizeClassName,
}) {
    const imageUrl =
        getProductImageUrl(
            product,
        );

    return (
        <Link
            href={route(
                'products.show',
                product.id,
            )}
            className={`${sizeClassName} shrink-0 overflow-hidden rounded-xl bg-slate-100`}
        >
            {imageUrl ? (
                <img
                    src={
                        imageUrl
                    }
                    alt={
                        product.name
                    }
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl">
                    📦
                </span>
            )}
        </Link>
    );
}

function ProductActions({
    product,
    canUpdateProduct,
    canDeleteProduct,
    deleting,
    onDelete,
    mobile = false,
}) {
    return (
        <div
            className={`flex items-center ${mobile
                    ? 'justify-end gap-2'
                    : 'justify-end gap-1'
                }`}
        >
            <ActionLink
                href={route(
                    'products.show',
                    product.id,
                )}
                label="Lihat Produk"
                icon="eye"
            />

            {canUpdateProduct && (
                <ActionLink
                    href={route(
                        'vendor.products.edit',
                        product.id,
                    )}
                    label="Edit Produk"
                    icon="edit"
                    className="text-violet-700 hover:bg-violet-50"
                />
            )}

            {canDeleteProduct && (
                <button
                    type="button"
                    onClick={() =>
                        onDelete(
                            product,
                        )
                    }
                    disabled={
                        deleting
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Hapus ${product.name}`}
                    title="Hapus Produk"
                >
                    {deleting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                    ) : (
                        <Icon
                            name="trash"
                            className="h-5 w-5"
                        />
                    )}
                </button>
            )}
        </div>
    );
}

function ActionLink({
    href,
    label,
    icon,
    className =
    'text-slate-600 hover:bg-slate-100',
}) {
    return (
        <Link
            href={href}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${className}`}
            aria-label={label}
            title={label}
        >
            <Icon
                name={icon}
                className="h-5 w-5"
            />
        </Link>
    );
}

function EmptyProducts({
    canCreateProduct,
}) {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Icon
                    name="box"
                    className="h-10 w-10"
                />
            </span>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
                Belum ada produk
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tambahkan produk pertama agar pelanggan dapat menemukannya di katalog NexCommerce.
            </p>

            {canCreateProduct && (
                <Link
                    href={route(
                        'vendor.products.create',
                    )}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                >
                    <Icon
                        name="plus"
                        className="h-5 w-5"
                    />

                    Tambah Produk
                </Link>
            )}
        </section>
    );
}

function EmptyFilterResult({
    onReset,
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon
                    name="search"
                    className="h-8 w-8"
                />
            </span>

            <h2 className="mt-5 text-xl font-black text-slate-900">
                Produk tidak ditemukan
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                Ubah kata pencarian atau kondisi stok yang dipilih.
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            >
                Reset Filter
            </button>
        </section>
    );
}

function Pagination({
    links = [],
}) {
    if (
        links.length <=
        3
    ) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2">
            {links.map(
                (
                    link,
                    index,
                ) => (
                    <Link
                        key={`${link.label}-${index}`}
                        href={
                            link.url ??
                            '#'
                        }
                        preserveScroll
                        className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black transition ${link.active
                                ? 'bg-violet-600 text-white'
                                : link.url
                                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
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

function getSkuItems(
    product,
) {
    return Array.isArray(
        product?.skus,
    )
        ? product.skus
        : [];
}

function getTotalStock(
    product,
) {
    return getSkuItems(
        product,
    ).reduce(
        (
            total,
            sku,
        ) =>
            total +
            Number(
                sku.stock ??
                0,
            ),
        0,
    );
}

function getPriceLabel(
    product,
) {
    const prices =
        getSkuItems(
            product,
        )
            .map((sku) =>
                Number(
                    sku.price ??
                    sku.current_price ??
                    0,
                ),
            )
            .filter(
                (price) =>
                    Number.isFinite(
                        price,
                    ),
            );

    if (
        prices.length ===
        0
    ) {
        return formatCurrency(
            0,
        );
    }

    const minimumPrice =
        Math.min(
            ...prices,
        );

    const maximumPrice =
        Math.max(
            ...prices,
        );

    if (
        minimumPrice ===
        maximumPrice
    ) {
        return formatCurrency(
            minimumPrice,
        );
    }

    return `${formatCurrency(
        minimumPrice,
    )} – ${formatCurrency(
        maximumPrice,
    )}`;
}

function getStockStatus(
    totalStock,
) {
    if (
        totalStock <=
        0
    ) {
        return {
            label:
                'Habis',
            className:
                'bg-red-100 text-red-700',
        };
    }

    if (
        totalStock <=
        5
    ) {
        return {
            label:
                'Menipis',
            className:
                'bg-amber-100 text-amber-700',
        };
    }

    return {
        label:
            'Tersedia',
        className:
            'bg-emerald-100 text-emerald-700',
    };
}

function getProductImageUrl(
    product,
) {
    return (
        product?.primary_image
            ?.image_url ??
        product?.primaryImage
            ?.image_url ??
        product?.primary_image_url ??
        product?.images?.[0]
            ?.image_url ??
        null
    );
}

function formatCurrency(
    value,
) {
    const number =
        Number(
            value ??
            0,
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
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
            </>
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
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        box: (
            <>
                <path d="m4 7 8-4 8 4-8 4-8-4Z" />
                <path d="M4 7v10l8 4 8-4V7" />
                <path d="M12 11v10" />
            </>
        ),
        layers: (
            <>
                <path d="m12 3-9 5 9 5 9-5-9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
            </>
        ),
        warehouse: (
            <>
                <path d="M3 10 12 4l9 6v10H3V10Z" />
                <path d="M7 14h10v6H7Z" />
            </>
        ),
        warning: (
            <>
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </>
        ),
        alert: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="M12 7v6" />
                <path d="M12 17h.01" />
            </>
        ),
        search: (
            <>
                <circle
                    cx="11"
                    cy="11"
                    r="7"
                />
                <path d="m20 20-3.2-3.2" />
            </>
        ),
        reset: (
            <>
                <path d="M4 4v6h6" />
                <path d="M20 20v-6h-6" />
                <path d="M5.5 15a8 8 0 0 0 13-3" />
                <path d="M18.5 9a8 8 0 0 0-13-3" />
            </>
        ),
        eye: (
            <>
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                />
            </>
        ),
        edit: (
            <>
                <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                <path d="m13.5 6.5 4 4" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.box}
        </svg>
    );
}