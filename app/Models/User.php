<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;


#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'vendor_id',
    'email_verified_at',
])] #[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(
            ActivityLog::class,
            'actor_id',
        );
    }

    public function orders(): HasMany
    {
        return $this->hasMany(
            Order::class,
            'customer_id',
        );
    }

    // Relasi ke toko jika user adalah seorang Vendor Owner
    public function vendor()
    {
        return $this->hasOne(Vendor::class, 'owner_id');
    }

    public function staffVendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    // Relasi ke tabel permissions untuk staff toko (Wajib ada agar seeder tidak error)
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'vendor_staff_permissions', 'staff_id', 'permission_id');
    }

    /**
     * Mengambil toko yang dapat dikelola user.
     */
    public function managedVendor(): ?Vendor
    {
        return match ($this->role) {
            'vendor_owner' => $this->vendor,
            'vendor_staff' => $this->staffVendor,
            default => null,
        };
    }

    /**
     * Memeriksa permission milik Vendor Staff.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()
            ->where('name', $permission)
            ->exists();
    }


    public function cart(): HasOne
    {
        return $this->hasOne(
            Cart::class,
            'customer_id',
        );
    }
}
