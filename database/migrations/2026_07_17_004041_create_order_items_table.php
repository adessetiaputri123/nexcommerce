<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('vendor_order_id')
                ->constrained('vendor_orders')
                ->cascadeOnDelete();

            $table
                ->foreignId('product_sku_id')
                ->constrained('product_skus')
                ->restrictOnDelete();

            $table->unsignedInteger('quantity');

            $table->decimal('price', 15, 2);

            $table->timestamps();

            $table->index([
                'vendor_order_id',
                'product_sku_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
