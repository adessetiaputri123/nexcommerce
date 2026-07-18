<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    /**
     * Melihat daftar produk toko.
     */
    public function viewAny(User $user): bool
    {
        if ($user->role === 'vendor_owner') {
            return $user->vendor()->exists();
        }

        if ($user->role === 'vendor_staff') {
            return $user->staffVendor()->exists()
                && $user->hasPermission('products.view');
        }

        return false;
    }

    /**
     * Melihat satu produk.
     */
    public function view(User $user, Product $product): bool
    {
        if (! $this->belongsToManagedVendor($user, $product)) {
            return false;
        }

        if ($user->role === 'vendor_owner') {
            return true;
        }

        return $user->role === 'vendor_staff'
            && $user->hasPermission('products.view');
    }

    /**
     * Membuat produk baru.
     */
    public function create(User $user): bool
    {
        if ($user->role === 'vendor_owner') {
            return $user->vendor()->exists();
        }

        return $user->role === 'vendor_staff'
            && $user->staffVendor()->exists()
            && $user->hasPermission('products.create');
    }

    /**
     * Mengubah produk.
     */
    public function update(User $user, Product $product): bool
    {
        if (! $this->belongsToManagedVendor($user, $product)) {
            return false;
        }

        if ($user->role === 'vendor_owner') {
            return true;
        }

        return $user->role === 'vendor_staff'
            && $user->hasPermission('products.update');
    }

    /**
     * Menghapus produk menggunakan Soft Delete.
     */
    public function delete(User $user, Product $product): bool
    {
        if (! $this->belongsToManagedVendor($user, $product)) {
            return false;
        }

        if ($user->role === 'vendor_owner') {
            return true;
        }

        return $user->role === 'vendor_staff'
            && $user->hasPermission('products.delete');
    }

    /**
     * Memulihkan produk yang dihapus.
     */
    public function restore(User $user, Product $product): bool
    {
        if (! $this->belongsToManagedVendor($user, $product)) {
            return false;
        }

        if ($user->role === 'vendor_owner') {
            return true;
        }

        return $user->role === 'vendor_staff'
            && $user->hasPermission('products.delete');
    }

    /**
     * Produk tidak boleh dihapus permanen dari aplikasi.
     */
    public function forceDelete(
        User $user,
        Product $product,
    ): bool {
        return false;
    }

    /**
     * Memastikan produk berada di toko yang dikelola user.
     */
    private function belongsToManagedVendor(
        User $user,
        Product $product,
    ): bool {
        $vendor = $user->managedVendor();

        if (! $vendor) {
            return false;
        }

        return (int) $vendor->id
            === (int) $product->vendor_id;
    }
}
