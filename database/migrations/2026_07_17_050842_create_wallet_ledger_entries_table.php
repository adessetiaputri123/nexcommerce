<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'wallet_ledger_entries',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->foreignId('wallet_id')
                    ->constrained('wallets')
                    ->restrictOnDelete();

                $table
                    ->foreignId('vendor_order_id')
                    ->nullable()
                    ->constrained('vendor_orders')
                    ->restrictOnDelete();

                $table->enum('entry_type', [
                    'credit',
                    'debit',
                ]);

                $table->decimal('amount', 15, 2);

                $table->decimal(
                    'balance_before',
                    15,
                    2,
                );

                $table->decimal(
                    'balance_after',
                    15,
                    2,
                );

                $table
                    ->string('idempotency_key')
                    ->unique();

                $table
                    ->string('description')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'wallet_id',
                    'created_at',
                ]);
            },
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'wallet_ledger_entries',
        );
    }
};
