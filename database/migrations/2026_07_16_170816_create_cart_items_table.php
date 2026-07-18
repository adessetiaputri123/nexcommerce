<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('cart_id')
                ->constrained('carts')
                ->cascadeOnDelete();

            $table
                ->foreignId('product_sku_id')
                ->constrained('product_skus')
                ->cascadeOnDelete();

            $table->unsignedInteger('quantity');

            $table->decimal(
                'price_snapshot',
                15,
                2,
            );

            $table->timestamps();

            $table->unique([
                'cart_id',
                'product_sku_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
