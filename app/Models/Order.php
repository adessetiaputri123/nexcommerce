<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'customer_id',
        'grand_total',
        'payment_status',
        'payment_reference',
        'paid_at',
        'expires_at',
        'expired_at',
        'stock_restored_at',
    ];

    protected function casts(): array
    {
        return [
            'grand_total' => 'decimal:2',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'expired_at' => 'datetime',
            'stock_restored_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id',
        );
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(
            VendorOrder::class,
        );
    }
}
