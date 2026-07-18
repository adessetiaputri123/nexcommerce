<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table
                ->string('payment_reference')
                ->nullable()
                ->unique()
                ->after('payment_status');

            $table
                ->timestamp('paid_at')
                ->nullable()
                ->after('payment_reference');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique([
                'payment_reference',
            ]);

            $table->dropColumn([
                'payment_reference',
                'paid_at',
            ]);
        });
    }
};
