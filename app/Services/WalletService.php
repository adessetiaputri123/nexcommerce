<?php

namespace App\Services;

use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Models\Wallet;
use App\Models\WalletLedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WalletService
{
    public function creditCompletedVendorOrder(
        VendorOrder $vendorOrder,
    ): WalletLedgerEntry {
        return DB::transaction(
            function () use ($vendorOrder): WalletLedgerEntry {
                /*
                 * Kunci Vendor Order agar proses kredit
                 * tidak berjalan bersamaan.
                 */
                $lockedVendorOrder = VendorOrder::query()
                    ->with('order')
                    ->whereKey($vendorOrder->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (
                    $lockedVendorOrder->delivery_status
                    !== 'completed'
                ) {
                    throw ValidationException::withMessages([
                        'wallet' =>
                        'Saldo hanya dapat ditambahkan '
                            . 'setelah pesanan selesai.',
                    ]);
                }

                if (
                    $lockedVendorOrder
                    ->order
                    ->payment_status !== 'paid'
                ) {
                    throw ValidationException::withMessages([
                        'wallet' =>
                        'Pesanan belum dibayar.',
                    ]);
                }

                $idempotencyKey =
                    "vendor-order:{$lockedVendorOrder->id}"
                    . ':completed-credit';

                /*
                 * Cegah Vendor Order yang sama
                 * dikreditkan lebih dari satu kali.
                 */
                $existingEntry =
                    WalletLedgerEntry::query()
                    ->where(
                        'idempotency_key',
                        $idempotencyKey,
                    )
                    ->first();

                if ($existingEntry) {
                    return $existingEntry;
                }

                /*
                 * Kunci vendor agar pembuatan wallet
                 * tidak bertabrakan.
                 */
                Vendor::query()
                    ->whereKey(
                        $lockedVendorOrder->vendor_id,
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Ambil wallet yang sudah ada atau
                 * buat wallet dengan saldo awal nol.
                 */
                $wallet = Wallet::firstOrCreate(
                    [
                        'vendor_id' =>
                        $lockedVendorOrder->vendor_id,
                    ],
                    [
                        'balance' => '0.00',
                    ],
                );

                /*
                 * Kunci wallet sebelum mengubah saldo.
                 */
                $wallet = Wallet::query()
                    ->whereKey($wallet->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Periksa kembali setelah wallet terkunci.
                 */
                $existingEntry =
                    WalletLedgerEntry::query()
                    ->where(
                        'idempotency_key',
                        $idempotencyKey,
                    )
                    ->first();

                if ($existingEntry) {
                    return $existingEntry;
                }

                $amountMinor = $this->toMinorUnits(
                    (string) $lockedVendorOrder->subtotal,
                );

                if ($amountMinor <= 0) {
                    throw ValidationException::withMessages([
                        'wallet' =>
                        'Nilai pendapatan vendor tidak valid.',
                    ]);
                }

                $balanceBeforeMinor =
                    $this->toMinorUnits(
                        (string) $wallet->balance,
                    );

                $balanceAfterMinor =
                    $balanceBeforeMinor + $amountMinor;

                $balanceBefore =
                    $this->toDecimalString(
                        $balanceBeforeMinor,
                    );

                $balanceAfter =
                    $this->toDecimalString(
                        $balanceAfterMinor,
                    );

                $amount =
                    $this->toDecimalString(
                        $amountMinor,
                    );

                /*
                 * Perbarui saldo wallet.
                 */
                $wallet->update([
                    'balance' => $balanceAfter,
                ]);

                /*
                 * Catat perubahan saldo pada ledger.
                 */
                return $wallet
                    ->ledgerEntries()
                    ->create([
                        'vendor_order_id' =>
                        $lockedVendorOrder->id,

                        'entry_type' => 'credit',

                        'amount' => $amount,

                        'balance_before' =>
                        $balanceBefore,

                        'balance_after' =>
                        $balanceAfter,

                        'idempotency_key' =>
                        $idempotencyKey,

                        'description' =>
                        "Pendapatan pesanan vendor "
                            . "#{$lockedVendorOrder->id}",
                    ]);
            },
            attempts: 5,
        );
    }

    private function toMinorUnits(
        string $amount,
    ): int {
        [$whole, $fraction] = array_pad(
            explode('.', $amount, 2),
            2,
            '0',
        );

        $fraction = str_pad(
            substr($fraction, 0, 2),
            2,
            '0',
        );

        return ((int) $whole * 100)
            + (int) $fraction;
    }

    private function toDecimalString(
        int $amount,
    ): string {
        $whole = intdiv($amount, 100);
        $fraction = $amount % 100;

        return sprintf(
            '%d.%02d',
            $whole,
            $fraction,
        );
    }
}
