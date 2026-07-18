<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'vendor_id',
        'name',
        'description',
    ];

    public function promotions(): BelongsToMany
    {
        return $this
            ->belongsToMany(
                Promotion::class,
                'product_promotion',
            )
            ->withTimestamps();
    }

    public function images(): HasMany
    {
        return $this
            ->hasMany(ProductImage::class)
            ->orderByDesc('is_primary')
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function primaryImage(): HasOne
    {
        return $this
            ->hasOne(ProductImage::class)
            ->where(
                'is_primary',
                true,
            );
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function skus()
    {
        return $this->hasMany(ProductSku::class);
    }
}
