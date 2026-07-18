<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'shop_name',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'owner_id',
        );
    }

    public function products(): HasMany
    {
        return $this->hasMany(
            Product::class,
        );
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(
            VendorOrder::class,
        );
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(
            Wallet::class,
        );
    }
}
