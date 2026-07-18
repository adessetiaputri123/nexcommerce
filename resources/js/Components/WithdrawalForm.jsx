import { useForm } from '@inertiajs/react';

export default function WithdrawalForm({
    wallet,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        amount: '',
        bank_name: '',
        bank_account_name: '',
        bank_account_number: '',
        vendor_note: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(
            route(
                'vendor.wallet.withdrawals.store',
                wallet.wallet_id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset(
                        'amount',
                        'vendor_note',
                    );
                },
            },
        );
    };

    return (
        <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                        Penarikan dana
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                        Tarik Saldo Toko
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                        Saldo tersedia:{' '}
                        <span className="font-black text-emerald-700">
                            {formatCurrency(
                                wallet.balance,
                            )}
                        </span>
                    </p>
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                    Maksimal{' '}
                    {formatCurrency(
                        wallet.balance,
                    )}
                </span>
            </div>

            <form
                onSubmit={submit}
                className="mt-5 grid gap-4 md:grid-cols-2"
            >
                <Field
                    label="Nominal Penarikan"
                    error={errors.amount}
                >
                    <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                            Rp
                        </span>

                        <input
                            type="number"
                            min="1"
                            max={Number(
                                wallet.balance ??
                                    0,
                            )}
                            step="1"
                            value={data.amount}
                            onChange={(event) =>
                                setData(
                                    'amount',
                                    event.target.value,
                                )
                            }
                            placeholder="100000"
                            className={`${inputClass(
                                errors.amount,
                            )} pl-11`}
                        />
                    </div>
                </Field>

                <Field
                    label="Nama Bank"
                    error={errors.bank_name}
                >
                    <input
                        type="text"
                        value={data.bank_name}
                        onChange={(event) =>
                            setData(
                                'bank_name',
                                event.target.value,
                            )
                        }
                        placeholder="Contoh: BCA"
                        className={inputClass(
                            errors.bank_name,
                        )}
                    />
                </Field>

                <Field
                    label="Nama Pemilik Rekening"
                    error={
                        errors.bank_account_name
                    }
                >
                    <input
                        type="text"
                        value={
                            data.bank_account_name
                        }
                        onChange={(event) =>
                            setData(
                                'bank_account_name',
                                event.target.value,
                            )
                        }
                        placeholder="Sesuai rekening bank"
                        className={inputClass(
                            errors.bank_account_name,
                        )}
                    />
                </Field>

                <Field
                    label="Nomor Rekening"
                    error={
                        errors.bank_account_number
                    }
                >
                    <input
                        type="text"
                        inputMode="numeric"
                        value={
                            data.bank_account_number
                        }
                        onChange={(event) =>
                            setData(
                                'bank_account_number',
                                event.target.value.replace(
                                    /\D/g,
                                    '',
                                ),
                            )
                        }
                        placeholder="Masukkan nomor rekening"
                        className={inputClass(
                            errors.bank_account_number,
                        )}
                    />
                </Field>

                <div className="md:col-span-2">
                    <Field
                        label="Catatan"
                        error={errors.vendor_note}
                    >
                        <textarea
                            rows={3}
                            value={data.vendor_note}
                            onChange={(event) =>
                                setData(
                                    'vendor_note',
                                    event.target.value,
                                )
                            }
                            placeholder="Catatan tambahan, boleh dikosongkan"
                            className={inputClass(
                                errors.vendor_note,
                            )}
                        />
                    </Field>
                </div>

                <div className="md:col-span-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {processing
                            ? 'Mengajukan Penarikan...'
                            : 'Ajukan Penarikan'}
                    </button>
                </div>
            </form>
        </section>
    );
}

function Field({
    label,
    error,
    children,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
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
    return `w-full rounded-xl bg-white text-sm shadow-none transition ${
        hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
    }`;
}

function formatCurrency(value) {
    const number = Number(value ?? 0);

    return `Rp ${Number.isFinite(number)
        ? number.toLocaleString('id-ID', {
              maximumFractionDigits: 0,
          })
        : '0'}`;
}
