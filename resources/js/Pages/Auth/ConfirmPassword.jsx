import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import {
    Head,
    useForm,
} from '@inertiajs/react';

export default function ConfirmPassword() {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        password: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi Kata Sandi" />

            <h1 className="text-2xl font-black text-slate-900">
                Konfirmasi Kata Sandi
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Halaman ini dilindungi. Masukkan kata sandi sebelum melanjutkan.
            </p>

            <form
                onSubmit={submit}
                className="mt-6 space-y-5"
            >
                <div>
                    <InputLabel
                        htmlFor="password"
                        value="Kata Sandi"
                    />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2 block w-full"
                        isFocused
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

                <PrimaryButton
                    className="w-full"
                    disabled={processing}
                >
                    {processing
                        ? 'Memeriksa...'
                        : 'Konfirmasi'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
