<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('customer_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table
                ->decimal('grand_total', 15, 2)
                ->default(0);

            $table
                ->enum('payment_status', [
                    'unpaid',
                    'pending',
                    'paid',
                    'failed',
                    'expired',
                    'refunded',
                ])
                ->default('unpaid');

            $table->timestamps();

            $table->index([
                'customer_id',
                'payment_status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
