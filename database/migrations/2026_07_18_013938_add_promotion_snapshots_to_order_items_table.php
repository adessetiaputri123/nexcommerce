<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'order_items',
            function (Blueprint $table): void {
                /*
                 * Harga normal per unit sebelum promo.
                 */
                $table
                    ->decimal(
                        'original_price',
                        15,
                        2,
                    )
                    ->nullable()
                    ->after('price');

                /*
                 * Potongan per unit.
                 */
                $table
                    ->decimal(
                        'discount_amount',
                        15,
                        2,
                    )
                    ->default(0)
                    ->after('original_price');

                /*
                 * Relasi promo boleh menjadi null karena
                 * promo dapat dihapus setelah transaksi.
                 */
                $table
                    ->foreignId(
                        'promotion_id',
                    )
                    ->nullable()
                    ->after('discount_amount')
                    ->constrained(
                        'promotions',
                    )
                    ->nullOnDelete();

                /*
                 * Snapshot informasi promo agar riwayat
                 * transaksi tidak berubah.
                 */
                $table
                    ->string(
                        'promotion_name',
                        150,
                    )
                    ->nullable()
                    ->after('promotion_id');

                $table
                    ->string(
                        'promotion_discount_type',
                        30,
                    )
                    ->nullable()
                    ->after('promotion_name');

                $table
                    ->decimal(
                        'promotion_discount_value',
                        15,
                        2,
                    )
                    ->nullable()
                    ->after(
                        'promotion_discount_type',
                    );
            },
        );
    }

    public function down(): void
    {
        Schema::table(
            'order_items',
            function (Blueprint $table): void {
                $table->dropForeign([
                    'promotion_id',
                ]);

                $table->dropColumn([
                    'original_price',
                    'discount_amount',
                    'promotion_id',
                    'promotion_name',
                    'promotion_discount_type',
                    'promotion_discount_value',
                ]);
            },
        );
    }
};
