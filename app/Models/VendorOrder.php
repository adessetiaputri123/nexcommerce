<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorOrder extends Model
{
    protected $fillable = [
        'order_id',
        'vendor_id',
        'subtotal',
        'shipping_cost',
        'delivery_status',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
        ];
    }

    public function walletLedgerEntries(): HasMany
    {
        return $this->hasMany(
            WalletLedgerEntry::class,
        );
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(
            Order::class,
        );
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(
            Vendor::class,
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            OrderItem::class,
        );
    }
}
