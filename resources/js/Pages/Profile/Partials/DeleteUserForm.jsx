import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import {
    useRef,
    useState,
} from 'react';

export default function DeleteUserForm({
    className = '',
}) {
    const [confirming, setConfirming] =
        useState(false);
    const passwordInput = useRef(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmDeletion = () => {
        setConfirming(true);
    };

    const closeModal = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    const deleteUser = (event) => {
        event.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: () =>
                passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <section className={className}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                    <h3 className="font-black text-slate-900">
                        Hapus akun secara permanen
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Seluruh data dan sumber daya yang
                        terkait dengan akun akan dihapus.
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={confirmDeletion}
                    className="shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
                >
                    Hapus Akun
                </button>
            </div>

            <Modal
                show={confirming}
                onClose={closeModal}
                maxWidth="lg"
            >
                <form
                    onSubmit={deleteUser}
                    className="p-6 sm:p-7"
                >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-700">
                        !
                    </span>

                    <h2 className="mt-5 text-xl font-black text-slate-900">
                        Hapus akun NexCommerce?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Masukkan kata sandi untuk
                        mengonfirmasi penghapusan akun
                        secara permanen.
                    </p>

                    <div className="mt-6">
                        <label
                            htmlFor="delete-account-password"
                            className="mb-2 block text-sm font-black text-slate-700"
                        >
                            Kata Sandi
                        </label>

                        <input
                            id="delete-account-password"
                            type="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(event) =>
                                setData(
                                    'password',
                                    event.target.value,
                                )
                            }
                            autoFocus
                            placeholder="Masukkan kata sandi"
                            className={`w-full rounded-xl bg-slate-50 text-sm shadow-none ${
                                errors.password
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-slate-200 focus:border-red-500 focus:ring-red-500'
                            }`}
                        />

                        {errors.password && (
                            <p className="mt-2 text-sm font-bold text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Menghapus...'
                                : 'Ya, Hapus Akun'}
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
