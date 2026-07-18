<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'promotions',
            function (Blueprint $table): void {
                $table->id();

                $table
                    ->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('name');

                $table
                    ->text('description')
                    ->nullable();

                /*
                 * Jenis kampanye:
                 * twin_date
                 * start_month
                 * end_month
                 * holiday
                 * celebration
                 * custom
                 */
                $table
                    ->string('campaign_type')
                    ->default('custom')
                    ->index();

                /*
                 * Jenis potongan:
                 * percentage
                 * fixed
                 */
                $table
                    ->string('discount_type')
                    ->default('percentage');

                $table->decimal(
                    'discount_value',
                    15,
                    2,
                );

                $table
                    ->decimal(
                        'minimum_order_amount',
                        15,
                        2,
                    )
                    ->nullable();

                /*
                 * Berguna untuk diskon persen.
                 * Contoh diskon 50% maksimal Rp50.000.
                 */
                $table
                    ->decimal(
                        'maximum_discount_amount',
                        15,
                        2,
                    )
                    ->nullable();

                $table
                    ->timestamp('starts_at')
                    ->index();

                $table
                    ->timestamp('ends_at')
                    ->index();

                /*
                 * Priority terbesar akan dipilih ketika
                 * beberapa promo aktif pada produk yang sama.
                 */
                $table
                    ->unsignedInteger('priority')
                    ->default(0);

                $table
                    ->boolean('is_active')
                    ->default(true)
                    ->index();

                $table->timestamps();

                $table->index([
                    'is_active',
                    'starts_at',
                    'ends_at',
                ]);
            },
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'promotions',
        );
    }
};
