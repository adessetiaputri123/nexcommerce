import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({
    children,
}) {
    const homeHref = route().has('catalog')
        ? route('catalog')
        : '/';

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
            <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative w-full max-w-md">
                <Link
                    href={homeHref}
                    className="mx-auto flex w-fit items-center gap-3"
                >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-950/30">
                        <ApplicationLogo className="h-7 w-7 fill-current text-white" />
                    </span>

                    <div>
                        <p className="text-xl font-black tracking-tight text-white">
                            NexCommerce
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                            Marketplace
                        </p>
                    </div>
                </Link>

                <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
                    {children}
                </div>

                <p className="mt-5 text-center text-xs font-semibold text-slate-400">
                    Transaksi lebih mudah bersama NexCommerce.
                </p>
            </div>
        </div>
    );
}
