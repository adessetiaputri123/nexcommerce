<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'product_promotion',
            function (Blueprint $table): void {
                $table->id();

                $table
                    ->foreignId('promotion_id')
                    ->constrained('promotions')
                    ->cascadeOnDelete();

                $table
                    ->foreignId('product_id')
                    ->constrained('products')
                    ->cascadeOnDelete();

                $table->timestamps();

                $table->unique([
                    'promotion_id',
                    'product_id',
                ]);
            },
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'product_promotion',
        );
    }
};
