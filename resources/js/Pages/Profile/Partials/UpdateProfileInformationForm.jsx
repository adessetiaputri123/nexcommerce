import { Transition } from '@headlessui/react';
import {
    Link,
    useForm,
    usePage,
} from '@inertiajs/react';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user =
        usePage().props.auth?.user ?? {};

    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <form
                onSubmit={submit}
                className="space-y-5"
            >
                <FormField
                    label="Nama Lengkap"
                    htmlFor="name"
                    error={errors.name}
                >
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(event) =>
                            setData(
                                'name',
                                event.target.value,
                            )
                        }
                        required
                        autoComplete="name"
                        autoFocus
                        className={inputClass(
                            errors.name,
                        )}
                    />
                </FormField>

                <FormField
                    label="Alamat Email"
                    htmlFor="email"
                    error={errors.email}
                >
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(event) =>
                            setData(
                                'email',
                                event.target.value,
                            )
                        }
                        required
                        autoComplete="username"
                        className={inputClass(
                            errors.email,
                        )}
                    />
                </FormField>

                {mustVerifyEmail &&
                    user.email_verified_at ===
                        null && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                            <p>
                                Alamat email kamu belum
                                terverifikasi.{' '}
                                <Link
                                    href={route(
                                        'verification.send',
                                    )}
                                    method="post"
                                    as="button"
                                    className="font-black underline underline-offset-2 hover:text-amber-950"
                                >
                                    Kirim ulang email
                                    verifikasi
                                </Link>
                                .
                            </p>

                            {status ===
                                'verification-link-sent' && (
                                <p className="mt-2 font-black text-emerald-700">
                                    Tautan verifikasi baru
                                    telah dikirim.
                                </p>
                            )}
                        </div>
                    )}

                <div className="flex flex-wrap items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Menyimpan...'
                            : 'Simpan Profil'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-black text-emerald-600">
                            Perubahan berhasil disimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

function FormField({
    label,
    htmlFor,
    error,
    children,
}) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-2 block text-sm font-black text-slate-700"
            >
                {label}
            </label>

            {children}

            {error && (
                <p className="mt-2 text-sm font-bold text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

function inputClass(hasError) {
    return `w-full rounded-xl bg-slate-50 text-sm shadow-none transition focus:bg-white ${
        hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
    }`;
}
