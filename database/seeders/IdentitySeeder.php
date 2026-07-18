<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class IdentitySeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Master Hak Akses
        |--------------------------------------------------------------------------
        |
        | firstOrCreate mencegah error duplicate apabila permission sudah ada.
        |
        */

        $pView = Permission::firstOrCreate([
            'name' => 'products.view',
        ]);

        $pCreate = Permission::firstOrCreate([
            'name' => 'products.create',
        ]);

        $pUpdate = Permission::firstOrCreate([
            'name' => 'products.update',
        ]);

        $pDelete = Permission::firstOrCreate([
            'name' => 'products.delete',
        ]);

        $pShip = Permission::firstOrCreate([
            'name' => 'orders.ship',
        ]);

        /*
        |--------------------------------------------------------------------------
        | 2. Super Admin
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            [
                'email' => 'admin@nexcommerce.com',
            ],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ],
        );

        /*
        |--------------------------------------------------------------------------
        | 3. Vendor Owner dan Toko
        |--------------------------------------------------------------------------
        */

        $owner = User::updateOrCreate(
            [
                'email' => 'budi@vendor.com',
            ],
            [
                'name' => 'Budi Pemilik Toko',
                'password' => Hash::make('password'),
                'role' => 'vendor_owner',
                'email_verified_at' => now(),
            ],
        );

        $vendor = Vendor::updateOrCreate(
            [
                'owner_id' => $owner->id,
            ],
            [
                'shop_name' => 'Tech Gadget Store',
            ],
        );

        // Membuat wallet hanya jika vendor belum memilikinya.
        // Saldo lama tidak akan diubah menjadi nol.
        $vendor->wallet()->firstOrCreate(
            [],
            [
                'balance' => 0.00,
            ],
        );

        /*
        |--------------------------------------------------------------------------
        | 4. Vendor Staff
        |--------------------------------------------------------------------------
        */

        $staff = User::updateOrCreate(
            [
                'email' => 'agus@vendor.com',
            ],
            [
                'name' => 'Agus Staff Gudang',
                'password' => Hash::make('password'),
                'role' => 'vendor_staff',
                'vendor_id' => $vendor->id,
                'email_verified_at' => now(),
            ],
        );

        // Mencegah data permission ganda pada tabel pivot.
        $staff->permissions()->sync([
            $pView->id,
            $pShip->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | 5. Customer
        |--------------------------------------------------------------------------
        */

        User::updateOrCreate(
            [
                'email' => 'iwan@gmail.com',
            ],
            [
                'name' => 'Iwan Pembeli',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ],
        );
    }
}
