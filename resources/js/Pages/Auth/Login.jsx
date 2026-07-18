import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';

export default function Login({
    status,
    canResetPassword,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <AuthHeader
                title="Selamat Datang"
                description="Masuk untuk melanjutkan aktivitas di NexCommerce."
            />

            {status && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {status}
                </div>
            )}

            <form
                onSubmit={submit}
                className="mt-6 space-y-5"
            >
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Alamat Email"
                    />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full"
                        autoComplete="username"
                        isFocused
                        required
                        onChange={(event) =>
                            setData(
                                'email',
                                event.target.value,
                            )
                        }
                    />
                    <InputError
                        message={errors.email}
                        className="mt-2"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <InputLabel
                            htmlFor="password"
                            value="Kata Sandi"
                        />

                        {canResetPassword && (
                            <Link
                                href={route(
                                    'password.request',
                                )}
                                className="text-xs font-black text-emerald-700 hover:text-emerald-800"
                            >
                                Lupa kata sandi?
                            </Link>
                        )}
                    </div>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2 block w-full"
                        autoComplete="current-password"
                        required
                        onChange={(event) =>
                            setData(
                                'password',
                                event.target.value,
                            )
                        }
                    />
                    <InputError
                        message={errors.password}
                        className="mt-2"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(event) =>
                            setData(
                                'remember',
                                event.target.checked,
                            )
                        }
                    />
                    Ingat saya
                </label>

                <PrimaryButton
                    className="w-full"
                    disabled={processing}
                >
                    {processing
                        ? 'Memproses...'
                        : 'Masuk'}
                </PrimaryButton>

                {route().has('register') && (
                    <p className="text-center text-sm font-semibold text-slate-500">
                        Belum memiliki akun?{' '}
                        <Link
                            href={route('register')}
                            className="font-black text-emerald-700 hover:text-emerald-800"
                        >
                            Daftar sekarang
                        </Link>
                    </p>
                )}
            </form>
        </GuestLayout>
    );
}

function AuthHeader({
    title,
    description,
}) {
    return (
        <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                Akun NexCommerce
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">
                {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}
