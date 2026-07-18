import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import {
    Link,
    router,
    usePage,
} from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
}) {
    const {
        auth,
        cartSummary,
        notificationSummary,
        unreadNotificationsCount,
    } = usePage().props;

    const user = auth?.user ?? {};
    const role = user?.role ?? 'customer';

    const [
        showingNavigationDropdown,
        setShowingNavigationDropdown,
    ] = useState(false);

    const navigationItems =
        getNavigationItems(
            role,
            auth,
        );

    const cartRoute =
        resolveRoute([
            'cart.index',
        ]);

    const notificationRoute =
        resolveRoute([
            'notifications.index',
            'notification.index',
        ]);

    const catalogRoute =
        resolveRoute([
            'catalog',
            'products.index',
        ]);

    const cartItemCount =
        Number(
            cartSummary?.item_count ??
            cartSummary?.items_count ??
            0,
        );

    const unreadNotificationCount =
        Number(
            notificationSummary
                ?.unread_count ??
            unreadNotificationsCount ??
            0,
        );

    const roleLabel =
        getRoleLabel(role);

    const closeMobileMenu = () => {
        setShowingNavigationDropdown(
            false,
        );
    };

    const goToCatalogSearch = (
        event,
    ) => {
        event.preventDefault();

        const formData =
            new FormData(
                event.currentTarget,
            );

        const search =
            String(
                formData.get(
                    'search',
                ) ?? '',
            ).trim();

        if (!catalogRoute) {
            return;
        }

        router.get(
            catalogRoute.href,
            search
                ? { search }
                : {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <MobileSidebar
                open={
                    showingNavigationDropdown
                }
                onClose={
                    closeMobileMenu
                }
                navigationItems={
                    navigationItems
                }
                user={user}
                roleLabel={
                    roleLabel
                }
            />

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
                <div className="flex h-20 items-center border-b border-slate-100 px-6">
                    <Brand />
                </div>

                <div className="border-b border-slate-100 px-5 py-5">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <UserAvatar
                            user={user}
                            size="large"
                        />

                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                                {user?.name ??
                                    'Pengguna'}
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                    {navigationItems.map(
                        (item) => (
                            <SidebarLink
                                key={
                                    item.label
                                }
                                item={item}
                            />
                        ),
                    )}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <Link
                        href={
                            route(
                                'profile.edit',
                            )
                        }
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <Icon
                            name="settings"
                            className="h-5 w-5"
                        />

                        Pengaturan Akun
                    </Link>

                    <Link
                        href={
                            route(
                                'logout',
                            )
                        }
                        method="post"
                        as="button"
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                        <Icon
                            name="logout"
                            className="h-5 w-5"
                        />

                        Keluar
                    </Link>
                </div>
            </aside>

            <div className="min-h-screen lg:pl-72">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
                        <button
                            type="button"
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    true,
                                )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
                            aria-label="Buka menu navigasi"
                            title="Menu"
                        >
                            <Icon
                                name="menu"
                                className="h-6 w-6"
                            />
                        </button>

                        <div className="lg:hidden">
                            <Brand compact />
                        </div>

                        <div className="hidden min-w-0 flex-1 md:block">
                            {catalogRoute ? (
                                <form
                                    onSubmit={
                                        goToCatalogSearch
                                    }
                                    className="relative max-w-xl"
                                >
                                    <Icon
                                        name="search"
                                        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="search"
                                        name="search"
                                        placeholder="Cari produk..."
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm shadow-none transition focus:border-emerald-500 focus:bg-white focus:ring-emerald-500"
                                    />
                                </form>
                            ) : (
                                <div />
                            )}
                        </div>

                        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                            {role ===
                                'customer' &&
                                cartRoute && (
                                    <IconButtonLink
                                        href={
                                            cartRoute.href
                                        }
                                        label="Keranjang"
                                        icon="cart"
                                        badge={
                                            cartItemCount
                                        }
                                    />
                                )}

                            {notificationRoute && (
                                <IconButtonLink
                                    href={
                                        notificationRoute.href
                                    }
                                    label="Notifikasi"
                                    icon="bell"
                                    badge={
                                        unreadNotificationCount
                                    }
                                />
                            )}

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="ml-1 inline-flex items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-slate-200 hover:bg-slate-50"
                                        aria-label="Buka menu profil"
                                    >
                                        <UserAvatar
                                            user={
                                                user
                                            }
                                        />

                                        <div className="hidden min-w-0 text-left xl:block">
                                            <p className="max-w-36 truncate text-sm font-black text-slate-800">
                                                {user?.name ??
                                                    'Pengguna'}
                                            </p>

                                            <p className="text-xs font-semibold text-slate-500">
                                                {
                                                    roleLabel
                                                }
                                            </p>
                                        </div>

                                        <Icon
                                            name="chevronDown"
                                            className="hidden h-4 w-4 text-slate-400 sm:block"
                                        />
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link
                                        href={
                                            route(
                                                'profile.edit',
                                            )
                                        }
                                    >
                                        Profil
                                    </Dropdown.Link>

                                    <Dropdown.Link
                                        href={
                                            route(
                                                'logout',
                                            )
                                        }
                                        method="post"
                                        as="button"
                                    >
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {header && (
                    <section className="border-b border-slate-200 bg-white">
                        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </section>
                )}

                <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function MobileSidebar({
    open,
    onClose,
    navigationItems,
    user,
    roleLabel,
}) {
    return (
        <div
            className={`fixed inset-0 z-50 lg:hidden ${
                open
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
            }`}
            aria-hidden={
                !open
            }
        >
            <button
                type="button"
                onClick={onClose}
                className={`absolute inset-0 bg-slate-950/40 transition-opacity ${
                    open
                        ? 'opacity-100'
                        : 'opacity-0'
                }`}
                aria-label="Tutup menu"
            />

            <aside
                className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-200 ${
                    open
                        ? 'translate-x-0'
                        : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
                    <Brand />

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                        aria-label="Tutup menu"
                    >
                        <Icon
                            name="close"
                            className="h-6 w-6"
                        />
                    </button>
                </div>

                <div className="border-b border-slate-100 p-5">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <UserAvatar
                            user={user}
                            size="large"
                        />

                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                                {user?.name ??
                                    'Pengguna'}
                            </p>

                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                {user?.email ??
                                    roleLabel}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
                    {navigationItems.map(
                        (item) => (
                            <SidebarLink
                                key={
                                    item.label
                                }
                                item={item}
                                onClick={
                                    onClose
                                }
                            />
                        ),
                    )}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <Link
                        href={
                            route(
                                'profile.edit',
                            )
                        }
                        onClick={
                            onClose
                        }
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                    >
                        <Icon
                            name="settings"
                            className="h-5 w-5"
                        />

                        Pengaturan Akun
                    </Link>

                    <Link
                        href={
                            route(
                                'logout',
                            )
                        }
                        method="post"
                        as="button"
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                        <Icon
                            name="logout"
                            className="h-5 w-5"
                        />

                        Keluar
                    </Link>
                </div>
            </aside>
        </div>
    );
}

function SidebarLink({
    item,
    onClick,
}) {
    const active =
        item.activePatterns.some(
            (pattern) =>
                route().current(
                    pattern,
                ),
        );

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                }`}
            >
                <Icon
                    name={item.icon}
                    className="h-5 w-5"
                />
            </span>

            <span className="min-w-0 flex-1 truncate">
                {item.label}
            </span>
        </Link>
    );
}

function IconButtonLink({
    href,
    label,
    icon,
    badge = 0,
}) {
    return (
        <Link
            href={href}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:h-11 sm:w-11"
            aria-label={label}
            title={label}
        >
            <Icon
                name={icon}
                className="h-5 w-5"
            />

            {Number(badge) >
                0 && (
                    <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                        {Number(
                            badge,
                        ) > 99
                            ? '99+'
                            : Number(
                                badge,
                            )}
                    </span>
                )}
        </Link>
    );
}

function Brand({
    compact = false,
}) {
    return (
        <Link
            href={
                route().has(
                    'catalog',
                )
                    ? route(
                        'catalog',
                    )
                    : '/'
            }
            className="inline-flex items-center gap-2.5"
        >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm">
                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
            </span>

            {!compact && (
                <div>
                    <p className="text-base font-black tracking-tight text-slate-900">
                        NexCommerce
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                        Marketplace
                    </p>
                </div>
            )}
        </Link>
    );
}

function UserAvatar({
    user,
    size = 'normal',
}) {
    const initial =
        user?.name
            ?.charAt(0)
            ?.toUpperCase() ??
        'U';

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-black text-white shadow-sm ${
                size === 'large'
                    ? 'h-11 w-11 text-base'
                    : 'h-9 w-9 text-sm sm:h-10 sm:w-10'
            }`}
        >
            {initial}
        </span>
    );
}

function getNavigationItems(
    role,
    auth = {},
) {
    const normalizedRole =
        String(role ?? '')
            .trim()
            .toLowerCase();

    const permissions =
        Array.isArray(
            auth?.permissions,
        )
            ? auth.permissions
            : [];

    const isVendorOwner =
        normalizedRole ===
        'vendor_owner';

    const canViewProducts =
        isVendorOwner ||
        permissions.includes(
            'products.view',
        );

    const canViewVendorOrders =
        isVendorOwner ||
        auth?.can_view_vendor_orders ===
            true;

    const canViewVendorWallet =
        isVendorOwner ||
        auth?.can_view_vendor_wallet ===
            true;

    const customerItems = [
        createNavigationItem({
            label: 'Dashboard',
            icon: 'dashboard',
            routeNames: [
                'dashboard',
            ],
            activePatterns: [
                'dashboard',
            ],
        }),
        createNavigationItem({
            label: 'Katalog',
            icon: 'store',
            routeNames: [
                'catalog',
                'products.index',
            ],
            activePatterns: [
                'catalog',
                'products.show',
            ],
        }),
        createNavigationItem({
            label: 'Pesanan Saya',
            icon: 'orders',
            routeNames: [
                'orders.index',
            ],
            activePatterns: [
                'orders.*',
            ],
        }),
        createNavigationItem({
            label: 'Keranjang',
            icon: 'cart',
            routeNames: [
                'cart.index',
            ],
            activePatterns: [
                'cart.*',
                'checkout.*',
            ],
        }),
        createNavigationItem({
            label: 'Notifikasi',
            icon: 'bell',
            routeNames: [
                'notifications.index',
                'notification.index',
            ],
            activePatterns: [
                'notifications.*',
                'notification.*',
            ],
        }),
    ];

    const vendorItems = [
        createNavigationItem({
            label: 'Ringkasan',
            icon: 'dashboard',
            routeNames: [
                'vendor.dashboard',
                'dashboard',
            ],
            activePatterns: [
                'vendor.dashboard',
                'dashboard',
            ],
        }),
        canViewProducts &&
        createNavigationItem({
            label: 'Produk Saya',
            icon: 'products',
            routeNames: [
                'vendor.products.index',
            ],
            activePatterns: [
                'vendor.products.*',
            ],
        }),
        canViewVendorOrders &&
        createNavigationItem({
            label: 'Pesanan Masuk',
            icon: 'orders',
            routeNames: [
                'vendor.orders.index',
                'vendor-order.index',
                'vendor-orders.index',
            ],
            activePatterns: [
                'vendor.orders.*',
                'vendor-order.*',
                'vendor-orders.*',
            ],
        }),
        canViewVendorWallet &&
        createNavigationItem({
            label: 'Wallet & Penarikan',
            icon: 'wallet',
            routeNames: [
                'vendor.wallet.index',
                'vendor.wallet',
            ],
            activePatterns: [
                'vendor.wallet.*',
            ],
        }),
        createNavigationItem({
            label: 'Katalog',
            icon: 'store',
            routeNames: [
                'catalog',
                'products.index',
            ],
            activePatterns: [
                'catalog',
                'products.show',
            ],
        }),
        createNavigationItem({
            label: 'Notifikasi',
            icon: 'bell',
            routeNames: [
                'notifications.index',
            ],
            activePatterns: [
                'notifications.*',
            ],
        }),
    ];

    const adminItems = [
        createNavigationItem({
            label: 'Ringkasan',
            icon: 'dashboard',
            routeNames: [
                'admin.dashboard',
                'dashboard',
            ],
            activePatterns: [
                'admin.dashboard',
                'dashboard',
            ],
        }),
        createNavigationItem({
            label: 'Promosi',
            icon: 'discount',
            routeNames: [
                'admin.promotions.index',
            ],
            activePatterns: [
                'admin.promotions.*',
            ],
        }),
        createNavigationItem({
            label: 'Penarikan Vendor',
            icon: 'payout',
            routeNames: [
                'admin.withdrawals.index',
            ],
            activePatterns: [
                'admin.withdrawals.*',
            ],
        }),
        createNavigationItem({
            label: 'Audit Log',
            icon: 'activity',
            routeNames: [
                'admin.activity-logs.index',
            ],
            activePatterns: [
                'admin.activity-logs.*',
            ],
        }),
        createNavigationItem({
            label: 'Laporan Transaksi',
            icon: 'report',
            routeNames: [
                'admin.reports.transactions.index',
            ],
            activePatterns: [
                'admin.reports.transactions.*',
            ],
        }),
        createNavigationItem({
            label: 'Katalog',
            icon: 'store',
            routeNames: [
                'catalog',
                'products.index',
            ],
            activePatterns: [
                'catalog',
                'products.show',
            ],
        }),
        createNavigationItem({
            label: 'Notifikasi',
            icon: 'bell',
            routeNames: [
                'notifications.index',
            ],
            activePatterns: [
                'notifications.*',
            ],
        }),
    ];

    if ([
        'admin',
        'super_admin',
    ].includes(normalizedRole)) {
        return adminItems.filter(Boolean);
    }

    if ([
        'vendor_owner',
        'vendor_staff',
    ].includes(normalizedRole)) {
        return vendorItems.filter(Boolean);
    }

    return customerItems.filter(Boolean);
}

function createNavigationItem({
    label,
    icon,
    routeNames,
    activePatterns,
}) {
    const resolvedRoute =
        resolveRoute(
            routeNames,
        );

    if (!resolvedRoute) {
        return null;
    }

    return {
        label,
        icon,
        href:
            resolvedRoute.href,
        routeName:
            resolvedRoute.name,
        activePatterns:
            activePatterns?.length
                ? activePatterns
                : [
                    resolvedRoute.name,
                ],
    };
}

function resolveRoute(
    routeNames,
) {
    const routeName =
        routeNames.find(
            (name) =>
                route().has(
                    name,
                ),
        );

    if (!routeName) {
        return null;
    }

    return {
        name: routeName,
        href: route(
            routeName,
        ),
    };
}

function getRoleLabel(
    role,
) {
    switch (
        String(role ?? '')
            .trim()
            .toLowerCase()
    ) {
        case 'super_admin':
            return 'Super Administrator';

        case 'admin':
            return 'Administrator';

        case 'vendor_owner':
            return 'Pemilik Vendor';

        case 'vendor_staff':
            return 'Staf Vendor';

        case 'customer':
            return 'Pembeli';

        default:
            return 'Pengguna';
    }
}

function Icon({
    name,
    className = 'h-5 w-5',
}) {
    const commonProps = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const paths = {
        menu: (
            <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
            </>
        ),
        close: (
            <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
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
        products: (
            <>
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4.5 7.8 7.5 4.2 7.5-4.2" />
                <path d="M12 12v9" />
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
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        discount: (
            <>
                <path d="M20 12 12 20 4 12l8-8 8 8Z" />
                <path d="M9.5 9.5h.01" />
                <path d="M14.5 14.5h.01" />
                <path d="m9 15 6-6" />
            </>
        ),
        vendor: (
            <>
                <path d="M4 10h16" />
                <path d="M5 10v10h14V10" />
                <path d="M3 10l2-6h14l2 6" />
                <path d="M8 20v-6h8v6" />
            </>
        ),
        wallet: (
            <>
                <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6Z" />
                <path d="M4 6V4h12" />
                <path d="M16 11h4" />
            </>
        ),
        payout: (
            <>
                <path d="M12 3v12" />
                <path d="m8 11 4 4 4-4" />
                <path d="M5 21h14" />
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
        activity: (
            <>
                <path d="M4 19V9" />
                <path d="M10 19V5" />
                <path d="M16 19v-7" />
                <path d="M22 19H2" />
            </>
        ),
        settings: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.1V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
            </>
        ),
        logout: (
            <>
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M14 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" />
            </>
        ),
        chevronDown: (
            <path d="m7 10 5 5 5-5" />
        ),
    };

    return (
        <svg {...commonProps}>
            {paths[name] ??
                paths.dashboard}
        </svg>
    );
}
