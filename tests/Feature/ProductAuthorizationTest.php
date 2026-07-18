<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Mencegah error Vite manifest saat menjalankan test.
        $this->withoutVite();
    }

    public function test_vendor_owner_can_view_product_management(): void
    {
        [$owner] = $this->createVendorOwner('owner-one');

        $response = $this
            ->actingAs($owner)
            ->get(route('vendor.products.index'));

        $response->assertOk();
    }

    public function test_staff_with_view_permission_can_view_products(): void
    {
        [, $vendor] = $this->createVendorOwner('owner-two');

        $staff = $this->createUser(
            name: 'Staff Produk',
            email: 'staff-view@example.com',
            role: 'vendor_staff',
            vendorId: $vendor->id,
        );

        $viewPermission = $this->createPermission(
            'products.view',
        );

        $staff->permissions()->attach(
            $viewPermission->id,
        );

        $response = $this
            ->actingAs($staff)
            ->get(route('vendor.products.index'));

        $response->assertOk();
    }

    public function test_customer_cannot_view_product_management(): void
    {
        $customer = $this->createUser(
            name: 'Customer',
            email: 'customer@example.com',
            role: 'customer',
        );

        $response = $this
            ->actingAs($customer)
            ->get(route('vendor.products.index'));

        $response->assertForbidden();
    }

    public function test_staff_without_create_permission_cannot_open_create_page(): void
    {
        [, $vendor] = $this->createVendorOwner('owner-three');

        $staff = $this->createUser(
            name: 'Staff Lihat Saja',
            email: 'staff-no-create@example.com',
            role: 'vendor_staff',
            vendorId: $vendor->id,
        );

        $viewPermission = $this->createPermission(
            'products.view',
        );

        $staff->permissions()->attach(
            $viewPermission->id,
        );

        $response = $this
            ->actingAs($staff)
            ->get(route('products.create'));

        $response->assertForbidden();
    }

    public function test_vendor_owner_can_edit_own_product(): void
    {
        [$owner, $vendor] =
            $this->createVendorOwner('owner-four');

        $product = $this->createProduct(
            $vendor,
            'Produk Milik Sendiri',
        );

        $response = $this
            ->actingAs($owner)
            ->get(route('products.edit', $product));

        $response->assertOk();
    }

    public function test_vendor_owner_cannot_edit_another_vendor_product(): void
    {
        [$firstOwner] =
            $this->createVendorOwner('owner-five');

        [, $secondVendor] =
            $this->createVendorOwner('owner-six');

        $otherProduct = $this->createProduct(
            $secondVendor,
            'Produk Vendor Lain',
        );

        $response = $this
            ->actingAs($firstOwner)
            ->get(route('products.edit', $otherProduct));

        $response->assertForbidden();
    }

    private function createVendorOwner(
        string $suffix,
    ): array {
        $owner = $this->createUser(
            name: "Owner {$suffix}",
            email: "{$suffix}@example.com",
            role: 'vendor_owner',
        );

        $vendor = new Vendor;
        $vendor->owner_id = $owner->id;
        $vendor->shop_name = "Toko {$suffix}";
        $vendor->save();

        return [$owner, $vendor];
    }

    private function createUser(
        string $name,
        string $email,
        string $role,
        ?int $vendorId = null,
    ): User {
        $user = new User;
        $user->name = $name;
        $user->email = $email;
        $user->password = Hash::make('password');
        $user->role = $role;
        $user->vendor_id = $vendorId;
        $user->email_verified_at = now();
        $user->save();

        return $user;
    }

    private function createPermission(
        string $name,
    ): Permission {
        $permission = new Permission;
        $permission->name = $name;
        $permission->save();

        return $permission;
    }

    private function createProduct(
        Vendor $vendor,
        string $name,
    ): Product {
        $product = new Product;
        $product->vendor_id = $vendor->id;
        $product->name = $name;
        $product->description = 'Produk untuk pengujian.';
        $product->save();

        return $product;
    }
}
