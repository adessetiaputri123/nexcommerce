<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use LogicException;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'actor_id',
        'vendor_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'actor_id',
        );
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(
            Vendor::class,
        );
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    protected static function booted(): void
    {
        static::updating(
            function (): void {
                throw new LogicException(
                    'Activity log tidak boleh diubah.',
                );
            },
        );

        static::deleting(
            function (): void {
                throw new LogicException(
                    'Activity log tidak boleh dihapus.',
                );
            },
        );
    }
}
