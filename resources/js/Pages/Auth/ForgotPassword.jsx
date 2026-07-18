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

export default function ForgotPassword({
    status,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <h1 className="text-2xl font-black text-slate-900">
                Lupa Kata Sandi?
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Masukkan alamat email. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
            </p>

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

                <PrimaryButton
                    className="w-full"
                    disabled={processing}
                >
                    {processing
                        ? 'Mengirim...'
                        : 'Kirim Tautan Reset'}
                </PrimaryButton>

                <Link
                    href={route('login')}
                    className="block text-center text-sm font-black text-emerald-700"
                >
                    Kembali ke halaman masuk
                </Link>
            </form>
        </GuestLayout>
    );
}
