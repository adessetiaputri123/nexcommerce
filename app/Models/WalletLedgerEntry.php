<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletLedgerEntry extends Model
{
    protected $fillable = [
        'wallet_id',
        'vendor_order_id',
        'withdrawal_request_id',
        'entry_type',
        'amount',
        'balance_before',
        'balance_after',
        'idempotency_key',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(
            VendorOrder::class,
        );
    }


    public function withdrawalRequest(): BelongsTo
    {
        return $this->belongsTo(
            WithdrawalRequest::class,
        );
    }
}
