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

export default function Register() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('register'), {
            onFinish: () =>
                reset(
                    'password',
                    'password_confirmation',
                ),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar" />

            <AuthHeader
                title="Buat Akun Baru"
                description="Daftar untuk mulai berbelanja dan mengelola aktivitas NexCommerce."
            />

            <form
                onSubmit={submit}
                className="mt-6 space-y-5"
            >
                <Field
                    id="name"
                    label="Nama Lengkap"
                    value={data.name}
                    error={errors.name}
                    autoComplete="name"
                    isFocused
                    onChange={(value) =>
                        setData('name', value)
                    }
                />

                <Field
                    id="email"
                    label="Alamat Email"
                    type="email"
                    value={data.email}
                    error={errors.email}
                    autoComplete="username"
                    onChange={(value) =>
                        setData('email', value)
                    }
                />

                <Field
                    id="password"
                    label="Kata Sandi"
                    type="password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="new-password"
                    onChange={(value) =>
                        setData('password', value)
                    }
                />

                <Field
                    id="password_confirmation"
                    label="Konfirmasi Kata Sandi"
                    type="password"
                    value={data.password_confirmation}
                    error={
                        errors.password_confirmation
                    }
                    autoComplete="new-password"
                    onChange={(value) =>
                        setData(
                            'password_confirmation',
                            value,
                        )
                    }
                />

                <PrimaryButton
                    className="w-full"
                    disabled={processing}
                >
                    {processing
                        ? 'Mendaftarkan...'
                        : 'Daftar'}
                </PrimaryButton>

                <p className="text-center text-sm font-semibold text-slate-500">
                    Sudah memiliki akun?{' '}
                    <Link
                        href={route('login')}
                        className="font-black text-emerald-700 hover:text-emerald-800"
                    >
                        Masuk
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}

function Field({
    id,
    label,
    type = 'text',
    value,
    error,
    autoComplete,
    isFocused = false,
    onChange,
}) {
    return (
        <div>
            <InputLabel
                htmlFor={id}
                value={label}
            />
            <TextInput
                id={id}
                name={id}
                type={type}
                value={value}
                className="mt-2 block w-full"
                autoComplete={autoComplete}
                isFocused={isFocused}
                required
                onChange={(event) =>
                    onChange(event.target.value)
                }
            />
            <InputError
                message={error}
                className="mt-2"
            />
        </div>
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
