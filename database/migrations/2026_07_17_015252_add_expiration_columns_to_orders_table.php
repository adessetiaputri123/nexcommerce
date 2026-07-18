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
                ->timestamp('expires_at')
                ->nullable()
                ->after('payment_status');

            $table
                ->timestamp('expired_at')
                ->nullable()
                ->after('expires_at');

            $table
                ->timestamp('stock_restored_at')
                ->nullable()
                ->after('expired_at');

            $table->index([
                'payment_status',
                'expires_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex([
                'payment_status',
                'expires_at',
            ]);

            $table->dropColumn([
                'expires_at',
                'expired_at',
                'stock_restored_at',
            ]);
        });
    }
};
