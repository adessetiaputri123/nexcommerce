<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table
                ->foreignId('vendor_id')
                ->constrained('vendors')
                ->restrictOnDelete();

            $table
                ->decimal('subtotal', 15, 2)
                ->default(0);

            $table
                ->decimal('shipping_cost', 15, 2)
                ->default(0);

            $table
                ->enum('delivery_status', [
                    'pending',
                    'confirmed',
                    'processing',
                    'packed',
                    'shipped',
                    'completed',
                    'cancelled',
                ])
                ->default('pending');

            $table->timestamps();

            $table->unique([
                'order_id',
                'vendor_id',
            ]);

            $table->index([
                'vendor_id',
                'delivery_status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_orders');
    }
};
