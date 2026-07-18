import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Profil Saya" />

            <div className="space-y-6">
                <PageHeader />

                <div className="grid gap-6 xl:grid-cols-2">
                    <ProfileSection
                        icon="user"
                        title="Informasi Profil"
                        description="Perbarui nama, alamat email, dan informasi dasar akun."
                        iconClassName="bg-indigo-100 text-indigo-700"
                    >
                        <UpdateProfileInformationForm
                            mustVerifyEmail={
                                mustVerifyEmail
                            }
                            status={
                                status
                            }
                            className="max-w-none"
                        />
                    </ProfileSection>

                    <ProfileSection
                        icon="lock"
                        title="Keamanan Akun"
                        description="Gunakan kata sandi yang kuat dan berbeda dari akun lainnya."
                        iconClassName="bg-emerald-100 text-emerald-700"
                    >
                        <UpdatePasswordForm className="max-w-none" />
                    </ProfileSection>
                </div>

                <DangerSection>
                    <DeleteUserForm className="max-w-none" />
                </DangerSection>
            </div>
        </AuthenticatedLayout>
    );
}

function PageHeader() {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                    Pengaturan akun
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Profil Saya
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Kelola informasi profil, keamanan akun, dan preferensi akun NexCommerce.
                </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 shadow-sm">
                <Icon
                    name="shield"
                    className="h-4 w-4 text-emerald-600"
                />

                Data akun terlindungi
            </div>
        </section>
    );
}

function ProfileSection({
    icon,
    title,
    description,
    iconClassName,
    children,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex items-start gap-3">
                    <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                    >
                        <Icon
                            name={icon}
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
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
    );
}

function DangerSection({
    children,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <header className="border-b border-red-100 bg-red-50 px-5 py-4">
                <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                        <Icon
                            name="warning"
                            className="h-6 w-6"
                        />
                    </span>

                    <div>
                        <h2 className="text-lg font-black text-red-900">
                            Zona Berbahaya
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-red-700">
                            Penghapusan akun bersifat permanen. Periksa kembali sebelum melanjutkan.
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-5 sm:p-6">
                {children}
            </div>
        </section>
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
        user: (
            <>
                <circle
                    cx="12"
                    cy="8"
                    r="4"
                />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        lock: (
            <>
                <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </>
        ),
        shield: (
            <>
                <path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        warning: (
            <>
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </>
        ),
    };

    return (
        <svg {...props}>
            {icons[name] ?? icons.user}
        </svg>
    );
}