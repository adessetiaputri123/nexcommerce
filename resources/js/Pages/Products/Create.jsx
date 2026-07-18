import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
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

export default function Create() {
    const fileInputRef =
        useRef(null);

    const [
        clientImageError,
        setClientImageError,
    ] = useState('');

    const {
        data,
        setData,
        post,
        processing,
        progress,
        errors,
        clearErrors,
    } = useForm({
        name: '',
        description: '',
        images: [],
        skus: [
            {
                sku: '',
                price: '',
                stock: '',
            },
        ],
    });

    const imagePreviews =
        useMemo(
            () =>
                data.images.map(
                    (
                        file,
                        index,
                    ) => ({
                        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
                        file,
                        url:
                            URL.createObjectURL(
                                file,
                            ),
                    }),
                ),
            [
                data.images,
            ],
        );

    useEffect(() => {
        return () => {
            imagePreviews.forEach(
                (
                    preview,
                ) => {
                    URL.revokeObjectURL(
                        preview.url,
                    );
                },
            );
        };
    }, [
        imagePreviews,
    ]);

    const handleImagesChange = (
        event,
    ) => {
        const selectedFiles =
            Array.from(
                event.target
                    .files ??
                [],
            );

        setClientImageError('');
        clearErrors(
            'images',
        );

        if (
            selectedFiles.length ===
            0
        ) {
            return;
        }

        const invalidType =
            selectedFiles.find(
                (file) =>
                    ![
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                    ].includes(
                        file.type,
                    ),
            );

        if (invalidType) {
            setClientImageError(
                'Foto harus berformat JPG, JPEG, PNG, atau WEBP.',
            );

            event.target.value =
                '';

            return;
        }

        const oversizedFile =
            selectedFiles.find(
                (file) =>
                    file.size >
                    MAX_FILE_SIZE,
            );

        if (oversizedFile) {
            setClientImageError(
                `Ukuran ${oversizedFile.name} melebihi 5 MB.`,
            );

            event.target.value =
                '';

            return;
        }

        const remainingSlots =
            MAX_IMAGES -
            data.images.length;

        if (
            remainingSlots <=
            0
        ) {
            setClientImageError(
                `Maksimal ${MAX_IMAGES} foto untuk satu produk.`,
            );

            event.target.value =
                '';

            return;
        }

        const existingIdentifiers =
            new Set(
                data.images.map(
                    (file) =>
                        `${file.name}-${file.size}-${file.lastModified}`,
                ),
            );

        const uniqueFiles =
            selectedFiles.filter(
                (file) => {
                    const identifier =
                        `${file.name}-${file.size}-${file.lastModified}`;

                    return !existingIdentifiers.has(
                        identifier,
                    );
                },
            );

        const acceptedFiles =
            uniqueFiles.slice(
                0,
                remainingSlots,
            );

        if (
            uniqueFiles.length >
            remainingSlots
        ) {
            setClientImageError(
                `Hanya ${remainingSlots} foto tambahan yang dapat dipilih.`,
            );
        }

        setData(
            'images',
            [
                ...data.images,
                ...acceptedFiles,
            ],
        );

        event.target.value =
            '';
    };

    const removeImage = (
        index,
    ) => {
        setData(
            'images',
            data.images.filter(
                (
                    _,
                    imageIndex,
                ) =>
                    imageIndex !==
                    index,
            ),
        );

        setClientImageError('');
        clearErrors(
            'images',
        );
    };

    const updateSku = (
        index,
        field,
        value,
    ) => {
        setData(
            'skus',
            data.skus.map(
                (
                    sku,
                    skuIndex,
                ) =>
                    skuIndex ===
                        index
                        ? {
                            ...sku,
                            [field]:
                                value,
                        }
                        : sku,
            ),
        );
    };

    const addSku =
        () => {
            setData(
                'skus',
                [
                    ...data.skus,
                    {
                        sku: '',
                        price:
                            '',
                        stock:
                            '',
                    },
                ],
            );
        };

    const removeSku = (
        index,
    ) => {
        if (
            data.skus.length ===
            1
        ) {
            return;
        }

        setData(
            'skus',
            data.skus.filter(
                (
                    _,
                    skuIndex,
                ) =>
                    skuIndex !==
                    index,
            ),
        );
    };

    const submit = (
        event,
    ) => {
        event.preventDefault();

        setClientImageError(
            '',
        );

        post(
            route(
                'vendor.products.store',
            ),
            {
                forceFormData:
                    true,
                preserveScroll:
                    true,
            },
        );
    };

    const totalStock =
        data.skus.reduce(
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

    const validPrices =
        data.skus
            .map((sku) =>
                Number(
                    sku.price,
                ),
            )
            .filter(
                (price) =>
                    Number.isFinite(
                        price,
                    ) &&
                    price >
                    0,
            );

    const minimumPrice =
        validPrices.length >
            0
            ? Math.min(
                ...validPrices,
            )
            : 0;

    const maximumPrice =
        validPrices.length >
            0
            ? Math.max(
                ...validPrices,
            )
            : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Produk" />

            <form
                onSubmit={
                    submit
                }
                className="space-y-6"
            >
                <PageHeader />

                {(errors.error ||
                    errors.skus) && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                            {errors.error ??
                                errors.skus}
                        </div>
                    )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        <ProductInformationCard
                            data={
                                data
                            }
                            setData={
                                setData
                            }
                            errors={
                                errors
                            }
                        />

                        <ProductImagesCard
                            fileInputRef={
                                fileInputRef
                            }
                            data={
                                data
                            }
                            imagePreviews={
                                imagePreviews
                            }
                            clientImageError={
                                clientImageError
                            }
                            errors={
                                errors
                            }
                            onImagesChange={
                                handleImagesChange
                            }
                            onRemoveImage={
                                removeImage
                            }
                        />

                        <VariantsCard
                            skus={
                                data.skus
                            }
                            errors={
                                errors
                            }
                            onUpdateSku={
                                updateSku
                            }
                            onAddSku={
                                addSku
                            }
                            onRemoveSku={
                                removeSku
                            }
                        />

                        {progress && (
                            <UploadProgress
                                percentage={
                                    progress.percentage
                                }
                            />
                        )}

                        <div className="flex flex-col-reverse gap-3 lg:hidden">
                            <Link
                                href={route(
                                    'vendor.products.index',
                                )}
                                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    processing
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-white" />
                                        Menyimpan Produk...
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            name="save"
                                            className="h-5 w-5"
                                        />
                                        Simpan Produk
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <ProductSummary
                        name={
                            data.name
                        }
                        imageCount={
                            data.images
                                .length
                        }
                        variantCount={
                            data.skus
                                .length
                        }
                        totalStock={
                            totalStock
                        }
                        minimumPrice={
                            minimumPrice
                        }
                        maximumPrice={
                            maximumPrice
                        }
                        processing={
                            processing
                        }
                    />
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

function PageHeader() {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Katalog vendor
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Tambah Produk
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Lengkapi informasi, foto, harga, dan stok sebelum produk dipublikasikan.
                </p>
            </div>

            <Link
                href={route(
                    'vendor.products.index',
                )}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
                <Icon
                    name="arrowLeft"
                    className="h-4 w-4"
                />

                Kembali ke Produk
            </Link>
        </section>
    );
}

function ProductInformationCard({
    data,
    setData,
    errors,
}) {
    return (
        <FormSection
            icon="box"
            title="Informasi Produk"
            description="Berikan nama dan deskripsi yang jelas agar produk mudah dipahami pelanggan."
            iconClassName="bg-indigo-100 text-indigo-700"
        >
            <div className="space-y-5">
                <FormField
                    label="Nama Produk"
                    error={
                        errors.name
                    }
                    htmlFor="name"
                    required
                >
                    <input
                        id="name"
                        type="text"
                        value={
                            data.name
                        }
                        onChange={(event) =>
                            setData(
                                'name',
                                event.target
                                    .value,
                            )
                        }
                        placeholder="Contoh: Smartphone NexPhone Pro"
                        className={inputClass(
                            errors.name,
                        )}
                    />
                </FormField>

                <FormField
                    label="Deskripsi"
                    error={
                        errors.description
                    }
                    htmlFor="description"
                >
                    <textarea
                        id="description"
                        rows={7}
                        value={
                            data.description
                        }
                        onChange={(event) =>
                            setData(
                                'description',
                                event.target
                                    .value,
                            )
                        }
                        placeholder="Jelaskan spesifikasi, keunggulan, kondisi, dan isi paket produk."
                        className={inputClass(
                            errors.description,
                        )}
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        Gunakan deskripsi yang singkat, akurat, dan mudah dibaca.
                    </p>
                </FormField>
            </div>
        </FormSection>
    );
}

function ProductImagesCard({
    fileInputRef,
    data,
    imagePreviews,
    clientImageError,
    errors,
    onImagesChange,
    onRemoveImage,
}) {
    const imageError =
        clientImageError ||
        errors.images;

    return (
        <FormSection
            icon="image"
            title="Foto Produk"
            description="Unggah sampai delapan foto. Foto pertama otomatis menjadi foto utama."
            iconClassName="bg-cyan-100 text-cyan-700"
            trailing={
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                    {
                        data.images
                            .length
                    }
                    /{MAX_IMAGES}
                </span>
            }
        >
            <input
                ref={
                    fileInputRef
                }
                id="images"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={
                    onImagesChange
                }
                className="hidden"
            />

            <button
                type="button"
                onClick={() =>
                    fileInputRef
                        .current
                        ?.click()
                }
                disabled={
                    data.images
                        .length >=
                    MAX_IMAGES
                }
                className={`flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${imageError
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50'
                    }`}
            >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                    <Icon
                        name="upload"
                        className="h-7 w-7"
                    />
                </span>

                <span className="mt-4 font-black text-slate-900">
                    Pilih Foto Produk
                </span>

                <span className="mt-1 text-sm font-semibold text-slate-500">
                    JPG, JPEG, PNG, atau WEBP · maksimal 5 MB
                </span>
            </button>

            {imageError && (
                <p className="mt-3 text-sm font-bold text-red-600">
                    {
                        imageError
                    }
                </p>
            )}

            {imagePreviews.length >
                0 && (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {imagePreviews.map(
                            (
                                preview,
                                index,
                            ) => (
                                <ImagePreview
                                    key={
                                        preview.id
                                    }
                                    preview={
                                        preview
                                    }
                                    index={
                                        index
                                    }
                                    error={
                                        errors[
                                        `images.${index}`
                                        ]
                                    }
                                    onRemove={() =>
                                        onRemoveImage(
                                            index,
                                        )
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
        </FormSection>
    );
}

function ImagePreview({
    preview,
    index,
    error,
    onRemove,
}) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="aspect-square overflow-hidden bg-white">
                <img
                    src={
                        preview.url
                    }
                    alt={`Preview produk ${index + 1
                        }`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
            </div>

            {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white shadow">
                    Foto Utama
                </span>
            )}

            <button
                type="button"
                onClick={
                    onRemove
                }
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/75 text-white transition hover:bg-red-600"
                aria-label={`Hapus ${preview.file.name}`}
                title="Hapus Foto"
            >
                <Icon
                    name="trash"
                    className="h-4 w-4"
                />
            </button>

            <div className="p-3">
                <p className="truncate text-xs font-black text-slate-700">
                    {
                        preview.file
                            .name
                    }
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                    {formatFileSize(
                        preview.file
                            .size,
                    )}
                </p>

                {error && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                        {
                            error
                        }
                    </p>
                )}
            </div>
        </article>
    );
}

function VariantsCard({
    skus,
    errors,
    onUpdateSku,
    onAddSku,
    onRemoveSku,
}) {
    return (
        <FormSection
            icon="layers"
            title="Varian Produk"
            description="Setiap varian memiliki kode SKU, harga, dan jumlah stok sendiri."
            iconClassName="bg-violet-100 text-violet-700"
            trailing={
                <button
                    type="button"
                    onClick={
                        onAddSku
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-200"
                >
                    <Icon
                        name="plus"
                        className="h-4 w-4"
                    />

                    Tambah Varian
                </button>
            }
        >
            <div className="space-y-4">
                {skus.map(
                    (
                        sku,
                        index,
                    ) => (
                        <VariantRow
                            key={
                                index
                            }
                            sku={
                                sku
                            }
                            index={
                                index
                            }
                            errors={
                                errors
                            }
                            canRemove={
                                skus.length >
                                1
                            }
                            onUpdate={
                                onUpdateSku
                            }
                            onRemove={
                                onRemoveSku
                            }
                        />
                    ),
                )}
            </div>
        </FormSection>
    );
}

function VariantRow({
    sku,
    index,
    errors,
    canRemove,
    onUpdate,
    onRemove,
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-violet-700 shadow-sm">
                        {index +
                            1}
                    </span>

                    <div>
                        <h3 className="font-black text-slate-900">
                            Varian{' '}
                            {index +
                                1}
                        </h3>

                        <p className="text-xs font-semibold text-slate-400">
                            Lengkapi data varian
                        </p>
                    </div>
                </div>

                {canRemove && (
                    <button
                        type="button"
                        onClick={() =>
                            onRemove(
                                index,
                            )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                        aria-label={`Hapus varian ${index + 1
                            }`}
                        title="Hapus Varian"
                    >
                        <Icon
                            name="trash"
                            className="h-5 w-5"
                        />
                    </button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <FormField
                    label="SKU"
                    error={
                        errors[
                        `skus.${index}.sku`
                        ]
                    }
                    required
                >
                    <input
                        type="text"
                        value={
                            sku.sku
                        }
                        onChange={(event) =>
                            onUpdate(
                                index,
                                'sku',
                                event.target
                                    .value,
                            )
                        }
                        placeholder="NX-PHONE-BLK"
                        className={inputClass(
                            errors[
                            `skus.${index}.sku`
                            ],
                        )}
                    />
                </FormField>

                <FormField
                    label="Harga"
                    error={
                        errors[
                        `skus.${index}.price`
                        ]
                    }
                    required
                >
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                            Rp
                        </span>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                                sku.price
                            }
                            onChange={(event) =>
                                onUpdate(
                                    index,
                                    'price',
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="1500000"
                            className={`${inputClass(
                                errors[
                                `skus.${index}.price`
                                ],
                            )} pl-11`}
                        />
                    </div>
                </FormField>

                <FormField
                    label="Stok"
                    error={
                        errors[
                        `skus.${index}.stock`
                        ]
                    }
                    required
                >
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                            sku.stock
                        }
                        onChange={(event) =>
                            onUpdate(
                                index,
                                'stock',
                                event.target
                                    .value,
                            )
                        }
                        placeholder="10"
                        className={inputClass(
                            errors[
                            `skus.${index}.stock`
                            ],
                        )}
                    />
                </FormField>
            </div>
        </article>
    );
}

function ProductSummary({
    name,
    imageCount,
    variantCount,
    totalStock,
    minimumPrice,
    maximumPrice,
    processing,
}) {
    return (
        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:block">
            <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Icon
                        name="clipboard"
                        className="h-6 w-6"
                    />
                </span>

                <div>
                    <h2 className="text-lg font-black text-slate-900">
                        Ringkasan Produk
                    </h2>

                    <p className="text-xs font-semibold text-slate-500">
                        Periksa sebelum disimpan
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <SummaryRow
                    label="Nama"
                    value={
                        name.trim() ||
                        'Belum diisi'
                    }
                />

                <SummaryRow
                    label="Foto"
                    value={`${imageCount}/${MAX_IMAGES}`}
                />

                <SummaryRow
                    label="Varian"
                    value={
                        variantCount
                    }
                />

                <SummaryRow
                    label="Total stok"
                    value={
                        totalStock
                    }
                />

                <SummaryRow
                    label="Rentang harga"
                    value={formatPriceRange(
                        minimumPrice,
                        maximumPrice,
                    )}
                />
            </div>

            <button
                type="submit"
                disabled={
                    processing
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-white" />
                        Menyimpan...
                    </>
                ) : (
                    <>
                        <Icon
                            name="save"
                            className="h-5 w-5"
                        />
                        Simpan Produk
                    </>
                )}
            </button>

            <Link
                href={route(
                    'vendor.products.index',
                )}
                className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
                Batal
            </Link>

            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                <div className="flex items-start gap-2">
                    <Icon
                        name="info"
                        className="mt-0.5 h-4 w-4 shrink-0 text-violet-600"
                    />

                    Produk akan tersedia sesuai proses dan validasi sistem.
                </div>
            </div>
        </aside>
    );
}

function FormSection({
    icon,
    title,
    description,
    iconClassName,
    trailing,
    children,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span
                            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                        >
                            <Icon
                                name={
                                    icon
                                }
                                className="h-6 w-6"
                            />
                        </span>

                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                {title}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {description}
                            </p>
                        </div>
                    </div>

                    {trailing}
                </div>
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function FormField({
    label,
    error,
    htmlFor,
    required = false,
    children,
}) {
    return (
        <div>
            <label
                htmlFor={
                    htmlFor
                }
                className="mb-2 block text-sm font-black text-slate-700"
            >
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-2 text-sm font-bold text-red-600">
                    {
                        error
                    }
                </p>
            )}
        </div>
    );
}

function UploadProgress({
    percentage,
}) {
    return (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <div className="flex items-center justify-between text-sm font-black text-violet-700">
                <span>
                    Mengunggah produk
                </span>

                <span>
                    {
                        percentage
                    }
                    %
                </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-violet-200">
                <div
                    className="h-full rounded-full bg-violet-600 transition-all"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </section>
    );
}

function SummaryRow({
    label,
    value,
}) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-500">
                {label}
            </span>

            <span className="max-w-44 text-right font-black text-slate-900">
                {value}
            </span>
        </div>
    );
}

function inputClass(
    hasError,
) {
    return `w-full rounded-xl bg-slate-50 text-sm shadow-none transition focus:bg-white ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-200 focus:border-violet-500 focus:ring-violet-500'
        }`;
}

function formatFileSize(
    size,
) {
    return `${(
        Number(
            size,
        ) /
        1024 /
        1024
    ).toFixed(
        2,
    )} MB`;
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

function formatPriceRange(
    minimumPrice,
    maximumPrice,
) {
    if (
        maximumPrice >
        0 &&
        maximumPrice !==
        minimumPrice
    ) {
        return `${formatCurrency(
            minimumPrice,
        )} – ${formatCurrency(
            maximumPrice,
        )}`;
    }

    return formatCurrency(
        minimumPrice,
    );
}

function Icon({
    name,
    className = 'h-5 w-5',
}) {
    const props = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const icons = {
        arrowLeft: (
            <>
                <path d="M19 12H5" />
                <path d="m10 17-5-5 5-5" />
            </>
        ),
        box: (
            <>
                <path d="m4 7 8-4 8 4-8 4-8-4Z" />
                <path d="M4 7v10l8 4 8-4V7" />
                <path d="M12 11v10" />
            </>
        ),
        image: (
            <>
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                />
                <circle
                    cx="8.5"
                    cy="9"
                    r="1.5"
                />
                <path d="m4 17 5-5 4 4 2-2 5 5" />
            </>
        ),
        upload: (
            <>
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M4 20h16" />
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
        layers: (
            <>
                <path d="m12 3-9 5 9 5 9-5-9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        clipboard: (
            <>
                <rect
                    x="5"
                    y="4"
                    width="14"
                    height="17"
                    rx="2"
                />
                <path d="M9 4V2h6v2" />
                <path d="M9 10h6" />
                <path d="M9 14h6" />
            </>
        ),
        save: (
            <>
                <path d="M5 4h12l2 2v14H5V4Z" />
                <path d="M8 4v6h8V4" />
                <path d="M8 20v-6h8v6" />
            </>
        ),
        info: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
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