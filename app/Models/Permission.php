<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = ['name'];

    public function staffs()
    {
        return $this->belongsToMany(User::class, 'vendor_staff_permissions', 'permission_id', 'staff_id');
    }
}
