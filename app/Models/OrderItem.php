<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'vendor_order_id',
        'product_sku_id',
        'quantity',
        'price',

        // Snapshot harga dan promo.
        'original_price',
        'discount_amount',
        'promotion_id',
        'promotion_name',
        'promotion_discount_type',
        'promotion_discount_value',
    ];

    protected function casts(): array
    {
        return [
            'vendor_order_id' =>
            'integer',

            'product_sku_id' =>
            'integer',

            'quantity' =>
            'integer',

            /*
             * Harga akhir setelah promo.
             */
            'price' =>
            'decimal:2',

            /*
             * Harga sebelum promo.
             */
            'original_price' =>
            'decimal:2',

            /*
             * Potongan per satu unit.
             */
            'discount_amount' =>
            'decimal:2',

            'promotion_id' =>
            'integer',

            'promotion_discount_value' =>
            'decimal:2',
        ];
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(
            VendorOrder::class,
        );
    }

    public function productSku(): BelongsTo
    {
        return $this->belongsTo(
            ProductSku::class,
        );
    }

    /**
     * Promo yang digunakan ketika pesanan dibuat.
     *
     * Relasi dapat bernilai null apabila tidak ada promo
     * atau promo sudah dihapus.
     */
    public function promotion(): BelongsTo
    {
        return $this->belongsTo(
            Promotion::class,
        );
    }
}
