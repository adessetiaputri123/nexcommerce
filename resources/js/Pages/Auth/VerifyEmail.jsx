import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import {
    Head,
    Link,
    useForm,
} from '@inertiajs/react';

export default function VerifyEmail({
    status,
}) {
    const {
        post,
        processing,
    } = useForm({});

    const submit = (event) => {
        event.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi Email" />

            <h1 className="text-2xl font-black text-slate-900">
                Verifikasi Email
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Buka email yang kami kirim dan klik tautan verifikasi untuk mengaktifkan akun.
            </p>

            {status ===
                'verification-link-sent' && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    Tautan verifikasi baru telah dikirim ke alamat email kamu.
                </div>
            )}

            <form
                onSubmit={submit}
                className="mt-6 space-y-4"
            >
                <PrimaryButton
                    className="w-full"
                    disabled={processing}
                >
                    {processing
                        ? 'Mengirim...'
                        : 'Kirim Ulang Email Verifikasi'}
                </PrimaryButton>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="block w-full text-center text-sm font-black text-slate-500 hover:text-red-600"
                >
                    Keluar dari akun
                </Link>
            </form>
        </GuestLayout>
    );
}
