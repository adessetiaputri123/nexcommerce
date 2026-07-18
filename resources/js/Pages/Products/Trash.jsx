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

export default function Trash({
    products = [],
    vendor = null,
}) {
    const {
        auth,
        flash,
        errors,
    } = usePage().props;

    const user = auth?.user;
    const permissions = Array.isArray(auth?.permissions)
        ? auth.permissions
        : [];

    const [search, setSearch] = useState('');
    const [restoringProductId, setRestoringProductId] = useState(null);

    const productItems = Array.isArray(products)
        ? products
        : Array.isArray(products?.data)
            ? products.data
            : [];

    const canRestoreProduct =
        user?.role === 'vendor_owner' ||
        permissions.includes('products.delete');

    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return productItems;

        return productItems.filter((product) => {
            const skuText = (product.skus ?? [])
                .map((sku) => sku.sku ?? sku.code)
                .filter(Boolean)
                .join(' ');

            return [product.name, product.description, skuText]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(keyword);
        });
    }, [productItems, search]);

    const handleRestore = (product) => {
        if (!window.confirm(`Pulihkan produk "${product.name}"?`)) return;

        router.patch(
            route('products.restore', product.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setRestoringProductId(product.id),
                onFinish: () => setRestoringProductId(null),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Produk Terhapus" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                            Arsip produk
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-900">
                            Produk Terhapus
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            {vendor?.shop_name ?? 'Toko Vendor'} memiliki{' '}
                            <span className="font-black text-slate-700">
                                {productItems.length}
                            </span>{' '}
                            produk yang dapat dipulihkan.
                        </p>
                    </div>

                    <Link
                        href={route('vendor.products.index')}
                        className="rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-black text-white shadow-sm hover:bg-violet-700"
                    >
                        Produk Aktif
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

                {productItems.length > 0 ? (
                    <>
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <label
                                htmlFor="trash-search"
                                className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500"
                            >
                                Cari Produk
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    id="trash-search"
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Nama produk atau SKU..."
                                    className="min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-red-500 focus:bg-white focus:ring-red-500"
                                />

                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    disabled={!search}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 disabled:opacity-40"
                                >
                                    Reset
                                </button>
                            </div>

                            <p className="mt-3 text-sm font-semibold text-slate-500">
                                {filteredProducts.length} produk ditampilkan
                            </p>
                        </section>

                        {filteredProducts.length === 0 ? (
                            <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                                <div className="text-5xl">🔎</div>
                                <h2 className="mt-5 text-xl font-black text-slate-900">
                                    Produk tidak ditemukan
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white"
                                >
                                    Hapus Pencarian
                                </button>
                            </section>
                        ) : (
                            <>
                                <div className="grid gap-4 md:hidden">
                                    {filteredProducts.map((product) => (
                                        <article
                                            key={product.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                        >
                                            <div className="flex gap-4 p-4">
                                                <ProductImage
                                                    product={product}
                                                    className="h-24 w-24"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <h2 className="line-clamp-2 font-black text-slate-900">
                                                        {product.name}
                                                    </h2>

                                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                                        Dihapus{' '}
                                                        {formatDate(
                                                            product.deleted_at,
                                                        )}
                                                    </p>

                                                    <SkuList
                                                        skus={product.skus}
                                                    />
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 p-3">
                                                {canRestoreProduct ? (
                                                    <RestoreButton
                                                        processing={
                                                            restoringProductId ===
                                                            product.id
                                                        }
                                                        onClick={() =>
                                                            handleRestore(
                                                                product,
                                                            )
                                                        }
                                                        full
                                                    />
                                                ) : (
                                                    <p className="text-center text-xs text-slate-400">
                                                        Tidak memiliki izin.
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <Heading>
                                                        Produk
                                                    </Heading>
                                                    <Heading>SKU</Heading>
                                                    <Heading>
                                                        Dihapus
                                                    </Heading>
                                                    <Heading right>
                                                        Aksi
                                                    </Heading>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {filteredProducts.map(
                                                    (product) => (
                                                        <tr
                                                            key={product.id}
                                                            className="hover:bg-slate-50"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <ProductImage
                                                                        product={
                                                                            product
                                                                        }
                                                                        className="h-16 w-16"
                                                                    />

                                                                    <div className="min-w-0">
                                                                        <p className="max-w-sm truncate font-black text-slate-900">
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </p>
                                                                        <p className="mt-1 max-w-sm truncate text-sm text-slate-500">
                                                                            {product.description ||
                                                                                'Tidak ada deskripsi produk.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <SkuList
                                                                    skus={
                                                                        product.skus
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-600">
                                                                {formatDate(
                                                                    product.deleted_at,
                                                                )}
                                                            </td>

                                                            <td className="px-5 py-4 text-right">
                                                                {canRestoreProduct ? (
                                                                    <RestoreButton
                                                                        processing={
                                                                            restoringProductId ===
                                                                            product.id
                                                                        }
                                                                        onClick={() =>
                                                                            handleRestore(
                                                                                product,
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">
                                                                        Tidak
                                                                        memiliki
                                                                        izin
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="text-6xl">✓</div>
                        <h2 className="mt-5 text-2xl font-black text-slate-900">
                            Tidak ada produk terhapus
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Semua produk toko masih aktif.
                        </p>
                        <Link
                            href={route('vendor.products.index')}
                            className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white"
                        >
                            Kembali ke Produk Aktif
                        </Link>
                    </section>
                )}

                {Array.isArray(products?.links) &&
                    products.links.length > 3 && (
                        <nav className="flex flex-wrap justify-center gap-2">
                            {products.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-xl px-3 py-2 text-sm font-black ${link.active
                                            ? 'bg-red-600 text-white'
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

function ProductImage({ product, className }) {
    const imageUrl =
        product?.primary_image?.image_url ??
        product?.primaryImage?.image_url ??
        product?.primary_image_url ??
        product?.images?.[0]?.image_url ??
        null;

    return (
        <div
            className={`${className} shrink-0 overflow-hidden rounded-xl bg-slate-100`}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover grayscale-[30%]"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                    📦
                </div>
            )}
        </div>
    );
}

function SkuList({ skus = [] }) {
    const items = Array.isArray(skus) ? skus : [];

    if (items.length === 0) {
        return (
            <span className="mt-2 block text-xs text-slate-400">
                Tidak ada SKU
            </span>
        );
    }

    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {items.map((sku) => (
                <span
                    key={sku.id}
                    className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600"
                >
                    {sku.sku ?? sku.code}
                </span>
            ))}
        </div>
    );
}

function RestoreButton({ processing, onClick, full = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={processing}
            className={`rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50 ${full ? 'w-full' : ''
                }`}
        >
            {processing ? 'Memulihkan...' : 'Pulihkan'}
        </button>
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