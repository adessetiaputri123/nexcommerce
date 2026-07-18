<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VendorOrderAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_owner_only_sees_orders_from_owned_vendor(): void
    {
        $data = $this->createVendorOrderData();

        $response = $this
            ->actingAs($data['ownerA'])
            ->get(route('vendor.orders.index'));

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component('VendorOrders/Index')
                    ->has('vendorOrders', 1)
                    ->where(
                        'vendorOrders.0.id',
                        $data['vendorOrderA']->id,
                    )
                    ->where(
                        'vendorOrders.0.vendor.id',
                        $data['vendorA']->id,
                    ),
            );
    }

    public function test_vendor_owner_cannot_update_another_vendor_order(): void
    {
        $data = $this->createVendorOrderData();

        $response = $this
            ->actingAs($data['ownerA'])
            ->patch(
                route(
                    'vendor.orders.status',
                    $data['vendorOrderB'],
                ),
                [
                    'delivery_status' => 'processing',
                ],
            );

        $response->assertForbidden();

        $this->assertSame(
            'confirmed',
            $data['vendorOrderB']
                ->fresh()
                ->delivery_status,
        );
    }

    public function test_vendor_can_update_status_in_correct_order(): void
    {
        $data = $this->createVendorOrderData();

        $response = $this
            ->actingAs($data['ownerA'])
            ->patch(
                route(
                    'vendor.orders.status',
                    $data['vendorOrderA'],
                ),
                [
                    'delivery_status' => 'processing',
                ],
            );

        $response->assertSessionHasNoErrors();

        $this->assertSame(
            'processing',
            $data['vendorOrderA']
                ->fresh()
                ->delivery_status,
        );
    }

    public function test_vendor_cannot_skip_delivery_status(): void
    {
        $data = $this->createVendorOrderData();

        $response = $this
            ->actingAs($data['ownerA'])
            ->from(route('vendor.orders.index'))
            ->patch(
                route(
                    'vendor.orders.status',
                    $data['vendorOrderA'],
                ),
                [
                    'delivery_status' => 'shipped',
                ],
            );

        $response->assertSessionHasErrors([
            'delivery_status',
        ]);

        $this->assertSame(
            'confirmed',
            $data['vendorOrderA']
                ->fresh()
                ->delivery_status,
        );
    }

    public function test_vendor_staff_can_access_assigned_vendor_order(): void
    {
        $data = $this->createVendorOrderData();

        $staff = User::factory()->create([
            'name' => 'Staff Toko Alpha',
            'email' => 'staff.alpha@example.com',
            'email_verified_at' => now(),
            'vendor_id' => $data['vendorA']->id,
        ]);

        $response = $this
            ->actingAs($staff)
            ->get(route('vendor.orders.index'));

        $response
            ->assertOk()
            ->assertInertia(
                fn(Assert $page) => $page
                    ->component('VendorOrders/Index')
                    ->has('vendorOrders', 1)
                    ->where(
                        'vendorOrders.0.id',
                        $data['vendorOrderA']->id,
                    ),
            );
    }

    private function createVendorOrderData(): array
    {
        $customer = User::factory()->create([
            'name' => 'Customer Vendor Order',
            'email' => 'customer.vendor@example.com',
            'email_verified_at' => now(),
            'role' => 'customer',
            'vendor_id' => null,
        ]);

        $ownerA = User::factory()->create([
            'name' => 'Pemilik Toko Alpha',
            'email' => 'vendor.alpha@example.com',
            'email_verified_at' => now(),
        ]);

        $ownerB = User::factory()->create([
            'name' => 'Pemilik Toko Beta',
            'email' => 'vendor.beta@example.com',
            'email_verified_at' => now(),
        ]);

        $vendorA = Vendor::forceCreate([
            'owner_id' => $ownerA->id,
            'shop_name' => 'Toko Alpha',
        ]);

        $vendorB = Vendor::forceCreate([
            'owner_id' => $ownerB->id,
            'shop_name' => 'Toko Beta',
        ]);

        $orderA = Order::forceCreate([
            'customer_id' => $customer->id,
            'grand_total' => '1000000.00',
            'payment_status' => 'paid',
            'payment_reference' => 'TEST-PAYMENT-ALPHA',
            'paid_at' => now(),
            'expires_at' => now()->addMinutes(10),
        ]);

        $orderB = Order::forceCreate([
            'customer_id' => $customer->id,
            'grand_total' => '2000000.00',
            'payment_status' => 'paid',
            'payment_reference' => 'TEST-PAYMENT-BETA',
            'paid_at' => now(),
            'expires_at' => now()->addMinutes(10),
        ]);

        $vendorOrderA = VendorOrder::forceCreate([
            'order_id' => $orderA->id,
            'vendor_id' => $vendorA->id,
            'subtotal' => '1000000.00',
            'shipping_cost' => '0.00',
            'delivery_status' => 'confirmed',
        ]);

        $vendorOrderB = VendorOrder::forceCreate([
            'order_id' => $orderB->id,
            'vendor_id' => $vendorB->id,
            'subtotal' => '2000000.00',
            'shipping_cost' => '0.00',
            'delivery_status' => 'confirmed',
        ]);

        return [
            'customer' => $customer,
            'ownerA' => $ownerA,
            'ownerB' => $ownerB,
            'vendorA' => $vendorA,
            'vendorB' => $vendorB,
            'orderA' => $orderA,
            'orderB' => $orderB,
            'vendorOrderA' => $vendorOrderA,
            'vendorOrderB' => $vendorOrderB,
        ];
    }
}
