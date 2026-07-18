import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({
    className = '',
}) {
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (event) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (responseErrors) => {
                if (responseErrors.password) {
                    reset(
                        'password',
                        'password_confirmation',
                    );
                    passwordInput.current?.focus();
                }

                if (
                    responseErrors.current_password
                ) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <form
                onSubmit={updatePassword}
                className="space-y-5"
            >
                <PasswordField
                    id="current_password"
                    label="Kata Sandi Saat Ini"
                    value={data.current_password}
                    error={errors.current_password}
                    inputRef={currentPasswordInput}
                    autoComplete="current-password"
                    onChange={(value) =>
                        setData(
                            'current_password',
                            value,
                        )
                    }
                />

                <PasswordField
                    id="password"
                    label="Kata Sandi Baru"
                    value={data.password}
                    error={errors.password}
                    inputRef={passwordInput}
                    autoComplete="new-password"
                    onChange={(value) =>
                        setData('password', value)
                    }
                />

                <PasswordField
                    id="password_confirmation"
                    label="Konfirmasi Kata Sandi Baru"
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

                <div className="flex flex-wrap items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Memperbarui...'
                            : 'Perbarui Kata Sandi'}
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
                            Kata sandi berhasil diperbarui.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

function PasswordField({
    id,
    label,
    value,
    error,
    inputRef,
    autoComplete,
    onChange,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-black text-slate-700"
            >
                {label}
            </label>

            <input
                id={id}
                ref={inputRef}
                type="password"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                autoComplete={autoComplete}
                className={`w-full rounded-xl bg-slate-50 text-sm shadow-none transition focus:bg-white ${
                    error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
            />

            {error && (
                <p className="mt-2 text-sm font-bold text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
