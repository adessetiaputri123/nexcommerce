<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSku extends Model
{
    protected $fillable = ['product_id', 'sku', 'price', 'stock'];


    public function orderItems(): HasMany
    {
        return $this->hasMany(
            OrderItem::class,
            'product_sku_id',
        );
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(
            CartItem::class,
            'product_sku_id',
        );
    }
}
