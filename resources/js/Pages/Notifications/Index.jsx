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

const FILTER_OPTIONS = [
    {
        value: 'all',
        label: 'Semua',
    },
    {
        value: 'unread',
        label: 'Belum Dibaca',
    },
    {
        value: 'read',
        label: 'Sudah Dibaca',
    },
];

export default function Index({
    notifications = {},
    unreadCount = 0,
}) {
    const { flash } =
        usePage().props;

    const [
        activeFilter,
        setActiveFilter,
    ] = useState('all');

    const [
        processingNotificationId,
        setProcessingNotificationId,
    ] = useState(null);

    const [
        processingAll,
        setProcessingAll,
    ] = useState(false);

    const notificationItems =
        Array.isArray(
            notifications,
        )
            ? notifications
            : Array.isArray(
                notifications?.data,
            )
                ? notifications.data
                : [];

    const filteredNotifications =
        useMemo(() => {
            if (
                activeFilter ===
                'unread'
            ) {
                return notificationItems.filter(
                    (notification) =>
                        !notification.is_read,
                );
            }

            if (
                activeFilter ===
                'read'
            ) {
                return notificationItems.filter(
                    (notification) =>
                        notification.is_read,
                );
            }

            return notificationItems;
        }, [
            notificationItems,
            activeFilter,
        ]);

    const markAsRead = (
        notification,
    ) => {
        if (
            notification.is_read ||
            processingNotificationId !==
            null
        ) {
            return;
        }

        router.post(
            route(
                'notifications.read',
                notification.id,
            ),
            {},
            {
                preserveScroll:
                    true,

                onStart: () => {
                    setProcessingNotificationId(
                        notification.id,
                    );
                },

                onFinish: () => {
                    setProcessingNotificationId(
                        null,
                    );
                },
            },
        );
    };

    const markAllAsRead =
        () => {
            if (
                Number(
                    unreadCount,
                ) <= 0 ||
                processingAll
            ) {
                return;
            }

            router.post(
                route(
                    'notifications.read-all',
                ),
                {},
                {
                    preserveScroll:
                        true,

                    onStart: () => {
                        setProcessingAll(
                            true,
                        );
                    },

                    onFinish: () => {
                        setProcessingAll(
                            false,
                        );
                    },
                },
            );
        };

    const openNotification = (
        notification,
    ) => {
        if (
            processingNotificationId !==
            null
        ) {
            return;
        }

        if (
            notification.is_read
        ) {
            if (
                notification.url
            ) {
                router.visit(
                    notification.url,
                );
            }

            return;
        }

        router.post(
            route(
                'notifications.read',
                notification.id,
            ),
            {},
            {
                preserveScroll:
                    true,

                onStart: () => {
                    setProcessingNotificationId(
                        notification.id,
                    );
                },

                onSuccess: () => {
                    if (
                        notification.url
                    ) {
                        router.visit(
                            notification.url,
                        );
                    }
                },

                onFinish: () => {
                    setProcessingNotificationId(
                        null,
                    );
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notifikasi" />

            <div className="space-y-6">
                <PageHeader
                    unreadCount={
                        Number(
                            unreadCount,
                        )
                    }
                    processingAll={
                        processingAll
                    }
                    onMarkAllAsRead={
                        markAllAsRead
                    }
                />

                {flash?.message && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                        {
                            flash.message
                        }
                    </div>
                )}

                {notificationItems.length >
                    0 ? (
                    <>
                        <NotificationFilters
                            activeFilter={
                                activeFilter
                            }
                            onChange={
                                setActiveFilter
                            }
                            notifications={
                                notificationItems
                            }
                        />

                        {filteredNotifications.length ===
                            0 ? (
                            <EmptyFilterResult
                                filter={
                                    activeFilter
                                }
                                onReset={() =>
                                    setActiveFilter(
                                        'all',
                                    )
                                }
                            />
                        ) : (
                            <div className="space-y-3">
                                {filteredNotifications.map(
                                    (
                                        notification,
                                    ) => (
                                        <NotificationCard
                                            key={
                                                notification.id
                                            }
                                            notification={
                                                notification
                                            }
                                            processing={
                                                processingNotificationId ===
                                                notification.id
                                            }
                                            onMarkAsRead={
                                                markAsRead
                                            }
                                            onOpen={
                                                openNotification
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}

                        <Pagination
                            links={
                                Array.isArray(
                                    notifications?.links,
                                )
                                    ? notifications.links
                                    : []
                            }
                        />
                    </>
                ) : (
                    <EmptyNotifications />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader({
    unreadCount,
    processingAll,
    onMarkAllAsRead,
}) {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Pusat aktivitas
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Notifikasi
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    {unreadCount >
                        0
                        ? `${unreadCount} notifikasi belum dibaca.`
                        : 'Semua notifikasi sudah dibaca.'}
                </p>
            </div>

            {unreadCount >
                0 && (
                    <button
                        type="button"
                        onClick={
                            onMarkAllAsRead
                        }
                        disabled={
                            processingAll
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processingAll ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-white" />
                        ) : (
                            <Icon
                                name="doubleCheck"
                                className="h-5 w-5"
                            />
                        )}

                        {processingAll
                            ? 'Memproses...'
                            : 'Tandai Semua Dibaca'}
                    </button>
                )}
        </section>
    );
}

function NotificationFilters({
    activeFilter,
    onChange,
    notifications,
}) {
    const counts =
        notifications.reduce(
            (
                result,
                notification,
            ) => {
                result.all += 1;

                if (
                    notification.is_read
                ) {
                    result.read += 1;
                } else {
                    result.unread += 1;
                }

                return result;
            },
            {
                all: 0,
                unread: 0,
                read: 0,
            },
        );

    return (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex min-w-max gap-2">
                {FILTER_OPTIONS.map(
                    (option) => {
                        const active =
                            activeFilter ===
                            option.value;

                        return (
                            <button
                                key={
                                    option.value
                                }
                                type="button"
                                onClick={() =>
                                    onChange(
                                        option.value,
                                    )
                                }
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active
                                        ? 'bg-violet-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {
                                    option.label
                                }

                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] ${active
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {
                                        counts[
                                        option
                                            .value
                                        ]
                                    }
                                </span>
                            </button>
                        );
                    },
                )}
            </div>
        </section>
    );
}

function NotificationCard({
    notification,
    processing,
    onMarkAsRead,
    onOpen,
}) {
    const appearance =
        getNotificationAppearance(
            notification,
        );

    return (
        <article
            className={`group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${notification.is_read
                    ? 'border-slate-200'
                    : appearance.borderClass
                }`}
        >
            {!notification.is_read && (
                <span
                    className={`absolute inset-y-0 left-0 w-1 ${appearance.accentClass}`}
                />
            )}

            <div className="flex gap-4">
                <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${appearance.iconClass}`}
                >
                    <Icon
                        name={
                            appearance.icon
                        }
                        className="h-6 w-6"
                    />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-black text-slate-900">
                                    {notification.title ??
                                        'Notifikasi'}
                                </h2>

                                {!notification.is_read && (
                                    <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white">
                                        Baru
                                    </span>
                                )}

                                <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ${appearance.badgeClass}`}
                                >
                                    {
                                        appearance.label
                                    }
                                </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {
                                    notification.message
                                }
                            </p>

                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                                <Icon
                                    name="clock"
                                    className="h-4 w-4"
                                />

                                {formatDate(
                                    notification.created_at,
                                )}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                            {!notification.is_read && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onMarkAsRead(
                                            notification,
                                        )
                                    }
                                    disabled={
                                        processing
                                    }
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Tandai dibaca"
                                    title="Tandai Dibaca"
                                >
                                    {processing ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
                                    ) : (
                                        <Icon
                                            name="check"
                                            className="h-5 w-5"
                                        />
                                    )}
                                </button>
                            )}

                            {notification.url && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onOpen(
                                            notification,
                                        )
                                    }
                                    disabled={
                                        processing
                                    }
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Buka notifikasi"
                                    title="Buka"
                                >
                                    <Icon
                                        name="arrowRight"
                                        className="h-5 w-5"
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function EmptyNotifications() {
    return (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Icon
                    name="bell"
                    className="h-10 w-10"
                />
            </span>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
                Belum ada notifikasi
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Aktivitas penting akun, pembayaran, pesanan, dan pengiriman akan tampil di sini.
            </p>

            <Link
                href={route(
                    'dashboard',
                )}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
                <Icon
                    name="dashboard"
                    className="h-5 w-5"
                />

                Kembali ke Dashboard
            </Link>
        </section>
    );
}

function EmptyFilterResult({
    filter,
    onReset,
}) {
    const message =
        filter === 'unread'
            ? 'Tidak ada notifikasi yang belum dibaca.'
            : 'Tidak ada notifikasi yang sudah dibaca.';

    return (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon
                    name="filter"
                    className="h-8 w-8"
                />
            </span>

            <h2 className="mt-5 text-xl font-black text-slate-900">
                Tidak ada hasil
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                {
                    message
                }
            </p>

            <button
                type="button"
                onClick={onReset}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            >
                Lihat Semua
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

function getNotificationAppearance(
    notification,
) {
    const haystack = [
        notification.type,
        notification.category,
        notification.title,
        notification.message,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (
        haystack.includes(
            'payment',
        ) ||
        haystack.includes(
            'pembayaran',
        ) ||
        haystack.includes(
            'paid',
        )
    ) {
        return {
            icon: 'wallet',
            label: 'Pembayaran',
            borderClass:
                'border-emerald-200',
            accentClass:
                'bg-emerald-500',
            iconClass:
                'bg-emerald-100 text-emerald-700',
            badgeClass:
                'bg-emerald-100 text-emerald-700',
        };
    }

    if (
        haystack.includes(
            'ship',
        ) ||
        haystack.includes(
            'delivery',
        ) ||
        haystack.includes(
            'kirim',
        ) ||
        haystack.includes(
            'pengiriman',
        )
    ) {
        return {
            icon: 'truck',
            label: 'Pengiriman',
            borderClass:
                'border-cyan-200',
            accentClass:
                'bg-cyan-500',
            iconClass:
                'bg-cyan-100 text-cyan-700',
            badgeClass:
                'bg-cyan-100 text-cyan-700',
        };
    }

    if (
        haystack.includes(
            'order',
        ) ||
        haystack.includes(
            'pesanan',
        )
    ) {
        return {
            icon: 'orders',
            label: 'Pesanan',
            borderClass:
                'border-indigo-200',
            accentClass:
                'bg-indigo-500',
            iconClass:
                'bg-indigo-100 text-indigo-700',
            badgeClass:
                'bg-indigo-100 text-indigo-700',
        };
    }

    const level =
        String(
            notification.level ??
            'info',
        ).toLowerCase();

    const levelAppearance = {
        success: {
            icon: 'check',
            label: 'Berhasil',
            borderClass:
                'border-emerald-200',
            accentClass:
                'bg-emerald-500',
            iconClass:
                'bg-emerald-100 text-emerald-700',
            badgeClass:
                'bg-emerald-100 text-emerald-700',
        },
        warning: {
            icon: 'warning',
            label: 'Peringatan',
            borderClass:
                'border-amber-200',
            accentClass:
                'bg-amber-500',
            iconClass:
                'bg-amber-100 text-amber-700',
            badgeClass:
                'bg-amber-100 text-amber-700',
        },
        danger: {
            icon: 'warning',
            label: 'Penting',
            borderClass:
                'border-red-200',
            accentClass:
                'bg-red-500',
            iconClass:
                'bg-red-100 text-red-700',
            badgeClass:
                'bg-red-100 text-red-700',
        },
        error: {
            icon: 'warning',
            label: 'Kesalahan',
            borderClass:
                'border-red-200',
            accentClass:
                'bg-red-500',
            iconClass:
                'bg-red-100 text-red-700',
            badgeClass:
                'bg-red-100 text-red-700',
        },
        info: {
            icon: 'bell',
            label: 'Informasi',
            borderClass:
                'border-blue-200',
            accentClass:
                'bg-blue-500',
            iconClass:
                'bg-blue-100 text-blue-700',
            badgeClass:
                'bg-blue-100 text-blue-700',
        },
    };

    return (
        levelAppearance[
        level
        ] ??
        levelAppearance.info
    );
}

function parseDateTime(
    value,
) {
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
        bell: (
            <>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </>
        ),
        doubleCheck: (
            <>
                <path d="m3 12 4 4 6-7" />
                <path d="m11 14 2 2 8-9" />
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
        arrowRight: (
            <>
                <path d="M5 12h14" />
                <path d="m14 7 5 5-5 5" />
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
        truck: (
            <>
                <path d="M3 6h11v10H3Z" />
                <path d="M14 9h4l3 3v4h-7Z" />
                <circle
                    cx="7"
                    cy="18"
                    r="2"
                />
                <circle
                    cx="18"
                    cy="18"
                    r="2"
                />
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
        warning: (
            <>
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </>
        ),
        filter: (
            <>
                <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
            </>
        ),
        dashboard: (
            <>
                <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                />
                <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                />
                <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                />
                <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ??
                icons.bell}
        </svg>
    );
}