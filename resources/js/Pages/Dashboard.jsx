import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Head,
    Link,
    usePage,
} from '@inertiajs/react';

export default function Dashboard() {
    const {
        auth,
        cartSummary,
    } = usePage().props;

    const user =
        auth?.user ?? {};

    const permissions =
        auth?.permissions ?? [];

    const cartItemCount =
        Number(
            cartSummary?.item_count ??
            0,
        );

    const isAdmin = [
        'admin',
        'super_admin',
    ].includes(
        user?.role,
    );

    const isVendor = [
        'vendor_owner',
        'vendor_staff',
    ].includes(
        user?.role,
    );

    const isCustomer =
        user?.role === 'customer';

    const canViewProducts =
        user?.role ===
        'vendor_owner' ||
        permissions.includes(
            'products.view',
        );

    const canCreateProduct =
        user?.role ===
        'vendor_owner' ||
        permissions.includes(
            'products.create',
        );

    const canViewVendorOrders =
        auth?.can_view_vendor_orders ===
        true;

    const canViewVendorWallet =
        auth?.can_view_vendor_wallet ===
        true;

    const canManageWithdrawals =
        auth?.can_manage_withdrawals ===
        true ||
        isAdmin;

    const canViewActivityLogs =
        auth?.can_view_activity_logs ===
        true ||
        isAdmin;

    const quickActions = [
        isCustomer &&
        createAction({
            title: 'Jelajahi Katalog',
            description:
                'Cari produk dan promo terbaru dari berbagai vendor.',
            icon: 'store',
            routeNames: [
                'catalog',
            ],
            tone: 'emerald',
        }),

        isCustomer &&
        createAction({
            title: 'Pesanan Saya',
            description:
                'Pantau pembayaran dan perjalanan pesanan.',
            icon: 'orders',
            routeNames: [
                'orders.index',
            ],
            tone: 'indigo',
        }),

        isCustomer &&
        createAction({
            title: 'Keranjang',
            description:
                `${cartItemCount} item sedang menunggu untuk checkout.`,
            icon: 'cart',
            routeNames: [
                'cart.index',
            ],
            tone: 'amber',
            badge:
                cartItemCount,
        }),

        isVendor &&
        createAction({
            title: 'Dashboard Vendor',
            description:
                'Lihat performa toko, penjualan, dan saldo.',
            icon: 'dashboard',
            routeNames: [
                'vendor.dashboard',
            ],
            tone: 'violet',
        }),

        canViewVendorOrders &&
        createAction({
            title: 'Pesanan Vendor',
            description:
                'Kelola pesanan yang masuk ke toko.',
            icon: 'orders',
            routeNames: [
                'vendor.orders.index',
            ],
            tone: 'blue',
        }),

        canViewVendorWallet &&
        createAction({
            title: 'Wallet Vendor',
            description:
                'Pantau saldo dan riwayat pencairan.',
            icon: 'wallet',
            routeNames: [
                'vendor.wallet.index',
            ],
            tone: 'teal',
        }),

        canViewProducts &&
        createAction({
            title: 'Kelola Produk',
            description:
                'Atur produk, SKU, stok, dan foto produk.',
            icon: 'products',
            routeNames: [
                'vendor.products.index',
            ],
            tone: 'indigo',
        }),

        canCreateProduct &&
        createAction({
            title: 'Tambah Produk',
            description:
                'Tambahkan produk baru ke katalog.',
            icon: 'plus',
            routeNames: [
                'vendor.products.create',
            ],
            tone: 'emerald',
        }),

        isAdmin &&
        createAction({
            title: 'Dashboard Admin',
            description:
                'Pantau seluruh operasi marketplace.',
            icon: 'dashboard',
            routeNames: [
                'admin.dashboard',
            ],
            tone: 'violet',
        }),

        isAdmin &&
        createAction({
            title: 'Kelola Promo',
            description:
                'Buat dan jadwalkan diskon marketplace.',
            icon: 'discount',
            routeNames: [
                'admin.promotions.index',
            ],
            tone: 'rose',
        }),

        canManageWithdrawals &&
        createAction({
            title: 'Kelola Penarikan',
            description:
                'Tinjau pencairan saldo yang diajukan vendor.',
            icon: 'wallet',
            routeNames: [
                'admin.withdrawals.index',
            ],
            tone: 'amber',
        }),

        canViewActivityLogs &&
        createAction({
            title: 'Audit Log',
            description:
                'Lihat aktivitas penting yang terjadi di sistem.',
            icon: 'activity',
            routeNames: [
                'admin.activity-logs.index',
            ],
            tone: 'slate',
        }),

        isAdmin &&
        createAction({
            title: 'Laporan Transaksi',
            description:
                'Buka data dan laporan transaksi marketplace.',
            icon: 'report',
            routeNames: [
                'admin.reports.transactions.index',
            ],
            tone: 'blue',
        }),
    ].filter(Boolean);

    const roleLabel =
        getRoleLabel(
            user?.role,
        );

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] backdrop-blur">
                            {roleLabel}
                        </span>

                        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                            Halo,{' '}
                            {firstName(
                                user?.name,
                            )}
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
                            Kelola aktivitas akun NexCommerce melalui satu dashboard yang lebih ringkas dan mudah digunakan.
                        </p>
                    </div>

                    <div className="grid min-w-[240px] grid-cols-2 gap-3">
                        <SummaryPill
                            label="Peran"
                            value={
                                roleLabel
                            }
                        />

                        <SummaryPill
                            label="Status"
                            value="Aktif"
                        />

                        {isCustomer && (
                            <SummaryPill
                                label="Keranjang"
                                value={`${cartItemCount} item`}
                            />
                        )}

                        <SummaryPill
                            label="Akun"
                            value={
                                user?.email ??
                                '-'
                            }
                            wide={
                                !isCustomer
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="mt-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                            Akses cepat
                        </p>

                        <h2 className="mt-1 text-2xl font-black text-slate-900">
                            Apa yang ingin dikerjakan?
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Menu ditampilkan sesuai peran dan izin akun.
                        </p>
                    </div>

                    <span className="text-sm font-bold text-slate-400">
                        {
                            quickActions.length
                        }{' '}
                        menu tersedia
                    </span>
                </div>

                {quickActions.length ===
                    0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                        <p className="font-bold text-slate-700">
                            Belum ada menu yang dapat diakses.
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Hubungi administrator untuk memeriksa izin akun.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {quickActions.map(
                            (action) => (
                                <ActionCard
                                    key={
                                        action.title
                                    }
                                    action={
                                        action
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Icon
                                name="shield"
                                className="h-6 w-6"
                            />
                        </span>

                        <div>
                            <h2 className="font-black text-slate-900">
                                Akun terlindungi
                            </h2>

                            <p className="text-sm text-slate-500">
                                Gunakan kata sandi kuat dan perbarui profil secara berkala.
                            </p>
                        </div>
                    </div>

                    {hasRoute(
                        'profile.edit',
                    ) && (
                            <Link
                                href={
                                    route(
                                        'profile.edit',
                                    )
                                }
                                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-800"
                            >
                                Kelola profil
                                <Icon
                                    name="arrow"
                                    className="h-4 w-4"
                                />
                            </Link>
                        )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        NexCommerce
                    </p>

                    <h2 className="mt-2 text-xl font-black">
                        Semua menu penting sudah ada di sidebar
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                        Keranjang, notifikasi, profil, dan menu utama kini lebih mudah diakses tanpa memenuhi halaman.
                    </p>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}

function ActionCard({
    action,
}) {
    const tone =
        toneClasses[
        action.tone
        ] ??
        toneClasses.emerald;

    return (
        <Link
            href={action.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tone.icon}`}
                >
                    <Icon
                        name={
                            action.icon
                        }
                        className="h-6 w-6"
                    />
                </span>

                {Number(
                    action.badge ??
                    0,
                ) > 0 && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone.badge}`}>
                            {
                                action.badge
                            }
                        </span>
                    )}
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900 group-hover:text-emerald-700">
                {
                    action.title
                }
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
                {
                    action.description
                }
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm font-black text-slate-700">
                Buka menu

                <Icon
                    name="arrow"
                    className="h-4 w-4 transition group-hover:translate-x-1"
                />
            </div>
        </Link>
    );
}

function SummaryPill({
    label,
    value,
    wide = false,
}) {
    return (
        <div className={`rounded-2xl bg-white/15 p-3 backdrop-blur ${wide ? 'col-span-2' : ''}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-black text-white">
                {value}
            </p>
        </div>
    );
}

function createAction({
    title,
    description,
    icon,
    routeNames,
    tone,
    badge,
}) {
    const routeName =
        routeNames.find(
            hasRoute,
        );

    if (!routeName) {
        return null;
    }

    return {
        title,
        description,
        icon,
        tone,
        badge,
        href:
            route(
                routeName,
            ),
    };
}

function hasRoute(
    routeName,
) {
    return route().has(
        routeName,
    );
}

function firstName(
    name,
) {
    return String(
        name ?? 'Pengguna',
    )
        .trim()
        .split(/\s+/)[0];
}

function getRoleLabel(
    role,
) {
    const labels = {
        admin:
            'Administrator',
        super_admin:
            'Super Administrator',
        vendor_owner:
            'Pemilik Vendor',
        vendor_staff:
            'Staf Vendor',
        customer:
            'Pembeli',
    };

    return labels[role] ??
        'Pengguna';
}

const toneClasses = {
    emerald: {
        icon:
            'bg-emerald-100 text-emerald-700',
        badge:
            'bg-emerald-100 text-emerald-700',
    },
    indigo: {
        icon:
            'bg-indigo-100 text-indigo-700',
        badge:
            'bg-indigo-100 text-indigo-700',
    },
    violet: {
        icon:
            'bg-violet-100 text-violet-700',
        badge:
            'bg-violet-100 text-violet-700',
    },
    amber: {
        icon:
            'bg-amber-100 text-amber-700',
        badge:
            'bg-amber-100 text-amber-700',
    },
    blue: {
        icon:
            'bg-blue-100 text-blue-700',
        badge:
            'bg-blue-100 text-blue-700',
    },
    teal: {
        icon:
            'bg-teal-100 text-teal-700',
        badge:
            'bg-teal-100 text-teal-700',
    },
    rose: {
        icon:
            'bg-rose-100 text-rose-700',
        badge:
            'bg-rose-100 text-rose-700',
    },
    slate: {
        icon:
            'bg-slate-100 text-slate-700',
        badge:
            'bg-slate-100 text-slate-700',
    },
};

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
        dashboard: (
            <>
                <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="2"
                />
                <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="2"
                />
                <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="2"
                />
                <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="2"
                />
            </>
        ),
        store: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v9h14v-9" />
                <path d="M3 10l2-6h14l2 6" />
                <path d="M9 19v-5h6v5" />
            </>
        ),
        orders: (
            <>
                <path d="M7 3h10l2 3v15H5V6l2-3Z" />
                <path d="M5 7h14" />
                <path d="M9 11h6" />
                <path d="M9 15h6" />
            </>
        ),
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
        products: (
            <>
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4.5 7.8 7.5 4.2 7.5-4.2" />
                <path d="M12 12v9" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6Z" />
                <path d="M4 6V4h12" />
                <path d="M16 11h4" />
            </>
        ),
        discount: (
            <>
                <path d="M20 12 12 20 4 12l8-8 8 8Z" />
                <path d="m9 15 6-6" />
                <path d="M9.5 9.5h.01" />
                <path d="M14.5 14.5h.01" />
            </>
        ),
        plus: (
            <>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </>
        ),
        activity: (
            <>
                <path d="M3 12h4l2-6 4 12 2-6h6" />
            </>
        ),
        report: (
            <>
                <path d="M5 3h10l4 4v14H5V3Z" />
                <path d="M15 3v5h5" />
                <path d="M9 17v-4" />
                <path d="M13 17V9" />
                <path d="M17 17v-6" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.dashboard}
        </svg>
    );
}