<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Wallet extends Model
{
    protected $fillable = [
        'vendor_id',
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(
            WithdrawalRequest::class,
        );
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(
            WalletLedgerEntry::class,
        );
    }
}
