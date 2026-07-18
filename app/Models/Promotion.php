<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Promotion extends Model
{
    use HasFactory;

    public const CAMPAIGN_TWIN_DATE =
    'twin_date';

    public const CAMPAIGN_START_MONTH =
    'start_month';

    public const CAMPAIGN_END_MONTH =
    'end_month';

    public const CAMPAIGN_HOLIDAY =
    'holiday';

    public const CAMPAIGN_CELEBRATION =
    'celebration';

    public const CAMPAIGN_CUSTOM =
    'custom';

    public const DISCOUNT_PERCENTAGE =
    'percentage';

    public const DISCOUNT_FIXED =
    'fixed';

    protected $fillable = [
        'created_by',
        'name',
        'description',
        'campaign_type',
        'discount_type',
        'discount_value',
        'minimum_order_amount',
        'maximum_discount_amount',
        'starts_at',
        'ends_at',
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' =>
            'decimal:2',

            'minimum_order_amount' =>
            'decimal:2',

            'maximum_discount_amount' =>
            'decimal:2',

            'starts_at' =>
            'datetime',

            'ends_at' =>
            'datetime',

            'priority' =>
            'integer',

            'is_active' =>
            'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by',
        );
    }

    public function products(): BelongsToMany
    {
        return $this
            ->belongsToMany(
                Product::class,
                'product_promotion',
            )
            ->withTimestamps();
    }

    public function scopeActive(
        Builder $query,
        ?CarbonInterface $moment = null,
    ): Builder {
        $dateTime =
            $moment ?? now();

        return $query
            ->where(
                'is_active',
                true,
            )
            ->where(
                'starts_at',
                '<=',
                $dateTime,
            )
            ->where(
                'ends_at',
                '>=',
                $dateTime,
            );
    }
}
