import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import {
    Head,
    useForm,
} from '@inertiajs/react';

export default function ResetPassword({
    token,
    email,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.store'), {
            onFinish: () =>
                reset(
                    'password',
                    'password_confirmation',
                ),
        });
    };

    return (
        <GuestLayout>
            <Head title="Atur Ulang Kata Sandi" />

            <h1 className="text-2xl font-black text-slate-900">
                Atur Ulang Kata Sandi
            </h1>
            <p className="mt-2 text-sm text-slate-500">
                Buat kata sandi baru untuk akun NexCommerce.
            </p>

            <form
                onSubmit={submit}
                className="mt-6 space-y-5"
            >
                <Field
                    id="email"
                    label="Alamat Email"
                    type="email"
                    value={data.email}
                    error={errors.email}
                    onChange={(value) =>
                        setData('email', value)
                    }
                />
                <Field
                    id="password"
                    label="Kata Sandi Baru"
                    type="password"
                    value={data.password}
                    error={errors.password}
                    isFocused
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
                        ? 'Menyimpan...'
                        : 'Simpan Kata Sandi Baru'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}

function Field({
    id,
    label,
    type,
    value,
    error,
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
                autoComplete={
                    type === 'email'
                        ? 'username'
                        : 'new-password'
                }
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
