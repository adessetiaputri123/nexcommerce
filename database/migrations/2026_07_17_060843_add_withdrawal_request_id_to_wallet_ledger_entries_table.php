<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'wallet_ledger_entries',
            function (Blueprint $table): void {
                $table
                    ->foreignId('withdrawal_request_id')
                    ->nullable()
                    ->after('vendor_order_id')
                    ->constrained('withdrawal_requests')
                    ->restrictOnDelete();
            },
        );
    }

    public function down(): void
    {
        Schema::table(
            'wallet_ledger_entries',
            function (Blueprint $table): void {
                $table->dropConstrainedForeignId(
                    'withdrawal_request_id',
                );
            },
        );
    }
};
