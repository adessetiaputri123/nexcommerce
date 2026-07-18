import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    router,
    useForm,
} from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Edit({ product }) {
    const fileInputRef = useRef(null);
    const [existingImages, setExistingImages] = useState(product?.images ?? []);
    const [clientImageError, setClientImageError] = useState('');
    const [processingImageId, setProcessingImageId] = useState(null);

    const initialSkus =
        product?.skus?.length > 0
            ? product.skus.map((sku) => ({
                id: sku.id,
                sku: sku.sku ?? '',
                price: sku.price ?? '',
                stock: sku.stock ?? '',
            }))
            : [{ id: null, sku: '', price: '', stock: '' }];

    const {
        data,
        setData,
        post,
        processing,
        progress,
        errors,
        clearErrors,
    } = useForm({
        _method: 'put',
        name: product?.name ?? '',
        description: product?.description ?? '',
        images: [],
        skus: initialSkus,
    });

    useEffect(() => {
        setExistingImages(product?.images ?? []);
    }, [product?.images]);

    const newImagePreviews = useMemo(
        () =>
            data.images.map((file, index) => ({
                id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
                file,
                url: URL.createObjectURL(file),
            })),
        [data.images],
    );

    useEffect(() => {
        return () => {
            newImagePreviews.forEach((preview) =>
                URL.revokeObjectURL(preview.url),
            );
        };
    }, [newImagePreviews]);

    const totalImages = existingImages.length + data.images.length;
    const hasExistingPrimary = existingImages.some((image) => image.is_primary);

    const handleImagesChange = (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        setClientImageError('');
        clearErrors('images');

        if (selectedFiles.length === 0) return;

        if (
            selectedFiles.some(
                (file) =>
                    !['image/jpeg', 'image/png', 'image/webp'].includes(
                        file.type,
                    ),
            )
        ) {
            setClientImageError(
                'Foto harus berformat JPG, JPEG, PNG, atau WEBP.',
            );
            event.target.value = '';
            return;
        }

        const oversized = selectedFiles.find(
            (file) => file.size > MAX_FILE_SIZE,
        );

        if (oversized) {
            setClientImageError(`Ukuran ${oversized.name} melebihi 5 MB.`);
            event.target.value = '';
            return;
        }

        const remainingSlots = MAX_IMAGES - totalImages;

        if (remainingSlots <= 0) {
            setClientImageError(
                `Maksimal ${MAX_IMAGES} foto untuk satu produk.`,
            );
            event.target.value = '';
            return;
        }

        const identifiers = new Set(
            data.images.map(
                (file) => `${file.name}-${file.size}-${file.lastModified}`,
            ),
        );

        const uniqueFiles = selectedFiles.filter(
            (file) =>
                !identifiers.has(
                    `${file.name}-${file.size}-${file.lastModified}`,
                ),
        );

        setData('images', [
            ...data.images,
            ...uniqueFiles.slice(0, remainingSlots),
        ]);

        if (uniqueFiles.length > remainingSlots) {
            setClientImageError(
                `Hanya ${remainingSlots} foto tambahan yang dapat dipilih.`,
            );
        }

        event.target.value = '';
    };

    const removeNewImage = (index) => {
        setData(
            'images',
            data.images.filter((_, imageIndex) => imageIndex !== index),
        );
        setClientImageError('');
        clearErrors('images');
    };

    const deleteExistingImage = (image) => {
        if (!window.confirm('Hapus foto produk ini?')) return;

        router.delete(
            route('vendor.products.images.destroy', [product.id, image.id]),
            {
                preserveScroll: true,
                onStart: () => setProcessingImageId(image.id),
                onSuccess: () =>
                    setExistingImages((current) =>
                        current.filter((item) => item.id !== image.id),
                    ),
                onFinish: () => setProcessingImageId(null),
            },
        );
    };

    const setPrimaryImage = (image) => {
        if (image.is_primary) return;

        router.patch(
            route('vendor.products.images.primary', [product.id, image.id]),
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessingImageId(image.id),
                onSuccess: () =>
                    setExistingImages((current) =>
                        current.map((item) => ({
                            ...item,
                            is_primary: item.id === image.id,
                        })),
                    ),
                onFinish: () => setProcessingImageId(null),
            },
        );
    };

    const updateSku = (index, field, value) => {
        setData(
            'skus',
            data.skus.map((sku, skuIndex) =>
                skuIndex === index ? { ...sku, [field]: value } : sku,
            ),
        );
    };

    const addSku = () => {
        setData('skus', [
            ...data.skus,
            { id: null, sku: '', price: '', stock: '' },
        ]);
    };

    const removeSku = (index) => {
        if (data.skus.length === 1) return;

        setData(
            'skus',
            data.skus.filter((_, skuIndex) => skuIndex !== index),
        );
    };

    const submit = (event) => {
        event.preventDefault();
        setClientImageError('');

        post(route('vendor.products.update', product.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const totalStock = data.skus.reduce(
        (total, sku) => total + Number(sku.stock ?? 0),
        0,
    );

    const prices = data.skus
        .map((sku) => Number(sku.price))
        .filter((price) => Number.isFinite(price) && price > 0);

    return (
        <AuthenticatedLayout>
            <Head title={`Edit ${product.name}`} />

            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                            Katalog vendor
                        </p>
                        <h1 className="mt-1 text-3xl font-black text-slate-900">
                            Edit Produk
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Perbarui informasi, galeri, harga, dan stok{' '}
                            <span className="font-black text-slate-700">
                                {product.name}
                            </span>
                            .
                        </p>
                    </div>

                    <Link
                        href={route('vendor.products.index')}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                        Kembali ke Produk
                    </Link>
                </div>

                {(errors.error || errors.skus) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {errors.error ?? errors.skus}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        <Section
                            title="Informasi Produk"
                            description="Nama dan deskripsi yang akan dilihat pembeli."
                        >
                            <div className="space-y-5">
                                <Field label="Nama Produk" error={errors.name}>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        className={inputClass(errors.name)}
                                    />
                                </Field>

                                <Field
                                    label="Deskripsi Produk"
                                    error={errors.description}
                                >
                                    <textarea
                                        rows={7}
                                        value={data.description}
                                        onChange={(event) =>
                                            setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                        className={inputClass(
                                            errors.description,
                                        )}
                                    />
                                </Field>
                            </div>
                        </Section>

                        <Section
                            title="Galeri Produk"
                            description="Maksimal delapan foto. Pilih satu foto sebagai foto utama."
                            badge={`${totalImages}/${MAX_IMAGES} foto`}
                        >
                            {existingImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                                    {existingImages.map((image) => (
                                        <article
                                            key={image.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-white">
                                                <img
                                                    src={image.image_url}
                                                    alt={
                                                        image.alt_text ??
                                                        product.name
                                                    }
                                                    className="h-full w-full object-cover"
                                                />

                                                {image.is_primary && (
                                                    <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white">
                                                        Foto Utama
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 p-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPrimaryImage(image)
                                                    }
                                                    disabled={
                                                        image.is_primary ||
                                                        processingImageId ===
                                                        image.id
                                                    }
                                                    className="rounded-xl bg-violet-100 px-2 py-2 text-xs font-black text-violet-700 disabled:opacity-40"
                                                >
                                                    Utama
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteExistingImage(
                                                            image,
                                                        )
                                                    }
                                                    disabled={
                                                        processingImageId ===
                                                        image.id
                                                    }
                                                    className="rounded-xl bg-red-100 px-2 py-2 text-xs font-black text-red-700 disabled:opacity-40"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                onChange={handleImagesChange}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={totalImages >= MAX_IMAGES}
                                className="mt-5 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
                            >
                                <span className="text-4xl">📷</span>
                                <span className="mt-3 font-black text-slate-900">
                                    Tambahkan Foto
                                </span>
                                <span className="mt-1 text-sm text-slate-500">
                                    JPG, PNG, atau WEBP · maksimal 5 MB
                                </span>
                            </button>

                            {(clientImageError || errors.images) && (
                                <p className="mt-3 text-sm font-bold text-red-600">
                                    {clientImageError ?? errors.images}
                                </p>
                            )}

                            {newImagePreviews.length > 0 && (
                                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                                    {newImagePreviews.map((preview, index) => (
                                        <article
                                            key={preview.id}
                                            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                        >
                                            <div className="aspect-square overflow-hidden bg-white">
                                                <img
                                                    src={preview.url}
                                                    alt={`Foto baru ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            {!hasExistingPrimary &&
                                                index === 0 && (
                                                    <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white">
                                                        Akan Jadi Utama
                                                    </span>
                                                )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                className="absolute right-2 top-2 h-9 w-9 rounded-xl bg-black/70 font-black text-white hover:bg-red-600"
                                            >
                                                ×
                                            </button>

                                            <div className="p-3">
                                                <p className="truncate text-xs font-black text-slate-700">
                                                    {preview.file.name}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {formatFileSize(
                                                        preview.file.size,
                                                    )}
                                                </p>
                                                {errors[`images.${index}`] && (
                                                    <p className="mt-2 text-xs font-bold text-red-600">
                                                        {
                                                            errors[
                                                            `images.${index}`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section
                            title="Varian dan SKU"
                            description="Perbarui kode SKU, harga, dan stok setiap varian."
                            action={
                                <button
                                    type="button"
                                    onClick={addSku}
                                    className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-black text-violet-700"
                                >
                                    + Tambah Varian
                                </button>
                            }
                        >
                            <div className="space-y-4">
                                {data.skus.map((sku, index) => (
                                    <article
                                        key={sku.id ?? `new-${index}`}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="font-black text-slate-900">
                                                Varian {index + 1}
                                            </h3>

                                            {data.skus.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSku(index)
                                                    }
                                                    className="text-sm font-black text-red-600"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            {['sku', 'price', 'stock'].map(
                                                (field) => (
                                                    <Field
                                                        key={field}
                                                        label={
                                                            field === 'sku'
                                                                ? 'SKU'
                                                                : field ===
                                                                    'price'
                                                                    ? 'Harga'
                                                                    : 'Stok'
                                                        }
                                                        error={
                                                            errors[
                                                            `skus.${index}.${field}`
                                                            ]
                                                        }
                                                    >
                                                        <input
                                                            type={
                                                                field === 'sku'
                                                                    ? 'text'
                                                                    : 'number'
                                                            }
                                                            min={
                                                                field === 'sku'
                                                                    ? undefined
                                                                    : '0'
                                                            }
                                                            step={
                                                                field ===
                                                                    'price'
                                                                    ? '0.01'
                                                                    : field ===
                                                                        'stock'
                                                                        ? '1'
                                                                        : undefined
                                                            }
                                                            value={sku[field]}
                                                            onChange={(event) =>
                                                                updateSku(
                                                                    index,
                                                                    field,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={inputClass(
                                                                errors[
                                                                `skus.${index}.${field}`
                                                                ],
                                                            )}
                                                        />
                                                    </Field>
                                                ),
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </Section>

                        {progress && (
                            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                                <div className="flex justify-between text-sm font-black text-violet-700">
                                    <span>Mengunggah perubahan</span>
                                    <span>{progress.percentage}%</span>
                                </div>
                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-violet-200">
                                    <div
                                        className="h-full rounded-full bg-violet-600"
                                        style={{
                                            width: `${progress.percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-violet-600 px-6 py-3 font-black text-white disabled:opacity-50 lg:hidden"
                        >
                            {processing
                                ? 'Menyimpan Perubahan...'
                                : 'Simpan Perubahan'}
                        </button>
                    </div>

                    <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:block">
                        <h2 className="text-lg font-black text-slate-900">
                            Ringkasan Perubahan
                        </h2>

                        <div className="mt-5 space-y-4 text-sm">
                            <Summary label="Nama" value={data.name || '-'} />
                            <Summary
                                label="Foto"
                                value={`${totalImages}/${MAX_IMAGES}`}
                            />
                            <Summary
                                label="Varian"
                                value={data.skus.length}
                            />
                            <Summary label="Total stok" value={totalStock} />
                            <Summary
                                label="Rentang harga"
                                value={formatPriceRange(prices)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                            {processing
                                ? 'Menyimpan...'
                                : 'Simpan Perubahan'}
                        </button>
                    </aside>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function Section({ title, description, badge, action, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {description}
                        </p>
                    </div>
                    {badge && (
                        <span className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                            {badge}
                        </span>
                    )}
                    {action}
                </div>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-2 text-sm font-bold text-red-600">{error}</p>
            )}
        </div>
    );
}

function Summary({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="font-semibold text-slate-500">{label}</span>
            <span className="max-w-44 text-right font-black text-slate-900">
                {value}
            </span>
        </div>
    );
}

function inputClass(hasError) {
    return `w-full rounded-xl bg-slate-50 text-sm shadow-none ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-200 focus:border-violet-500 focus:ring-violet-500'
        }`;
}

function formatFileSize(size) {
    return `${(Number(size) / 1024 / 1024).toFixed(2)} MB`;
}

function formatCurrency(value) {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID', {
        maximumFractionDigits: 0,
    })}`;
}

function formatPriceRange(prices) {
    if (prices.length === 0) return formatCurrency(0);

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return min === max
        ? formatCurrency(min)
        : `${formatCurrency(min)} – ${formatCurrency(max)}`;
}