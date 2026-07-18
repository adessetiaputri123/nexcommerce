<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductSku;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Services\ExpireOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_expired_unpaid_order_restores_stock(): void
    {
        $data = $this->createOrderData();

        $result = app(ExpireOrderService::class)
            ->expire($data['order']);

        $this->assertTrue($result);

        $order = $data['order']->fresh();
        $vendorOrder = $data['vendorOrder']->fresh();
        $sku = $data['sku']->fresh();

        $this->assertSame(
            'expired',
            $order->payment_status,
        );

        $this->assertNotNull(
            $order->expired_at,
        );

        $this->assertNotNull(
            $order->stock_restored_at,
        );

        $this->assertSame(
            'cancelled',
            $vendorOrder->delivery_status,
        );

        /*
         * Stok sebelum expire adalah 7.
         * Quantity order adalah 3.
         * Setelah dikembalikan menjadi 10.
         */
        $this->assertSame(
            10,
            $sku->stock,
        );
    }

    public function test_order_cannot_restore_stock_twice(): void
    {
        $data = $this->createOrderData();

        $service = app(
            ExpireOrderService::class,
        );

        $firstResult = $service->expire(
            $data['order'],
        );

        $secondResult = $service->expire(
            $data['order']->fresh(),
        );

        $this->assertTrue($firstResult);
        $this->assertFalse($secondResult);

        /*
         * Stok harus tetap 10, bukan menjadi 13.
         */
        $this->assertSame(
            10,
            $data['sku']->fresh()->stock,
        );
    }

    public function test_future_order_is_not_expired(): void
    {
        $data = $this->createOrderData(
            alreadyExpired: false,
        );

        $result = app(ExpireOrderService::class)
            ->expire($data['order']);

        $this->assertFalse($result);

        $order = $data['order']->fresh();
        $vendorOrder = $data['vendorOrder']->fresh();
        $sku = $data['sku']->fresh();

        $this->assertSame(
            'unpaid',
            $order->payment_status,
        );

        $this->assertNull(
            $order->expired_at,
        );

        $this->assertNull(
            $order->stock_restored_at,
        );

        $this->assertSame(
            'pending',
            $vendorOrder->delivery_status,
        );

        /*
         * Stok tidak boleh berubah.
         */
        $this->assertSame(
            7,
            $sku->stock,
        );
    }

    private function createOrderData(
        bool $alreadyExpired = true,
    ): array {
        $customer = User::factory()->create([
            'name' => 'Customer Expire',
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'role' => 'customer',
            'vendor_id' => null,
        ]);

        $vendorOwner = User::factory()->create([
            'name' => 'Pemilik Toko Expire',
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $vendorOwner->id,
            'shop_name' => 'Toko Expire',
        ]);

        $product = Product::forceCreate([
            'vendor_id' => $vendor->id,
            'name' => 'Produk Expire',
            'description' =>
            'Produk untuk pengujian auto-expire.',
        ]);

        /*
         * Anggap stok awalnya 10, kemudian checkout
         * mengurangi 3 sehingga tersisa 7.
         */
        $sku = ProductSku::forceCreate([
            'product_id' => $product->id,
            'sku' => 'EXPIRE-SKU-001',
            'price' => '500000.00',
            'stock' => 7,
        ]);

        $order = Order::forceCreate([
            'customer_id' => $customer->id,
            'grand_total' => '1500000.00',
            'payment_status' => 'unpaid',

            'expires_at' => $alreadyExpired
                ? now()->subMinute()
                : now()->addMinutes(10),

            'expired_at' => null,
            'stock_restored_at' => null,
        ]);

        $vendorOrder = VendorOrder::forceCreate([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'subtotal' => '1500000.00',
            'shipping_cost' => '0.00',
            'delivery_status' => 'pending',
        ]);

        $orderItem = OrderItem::forceCreate([
            'vendor_order_id' =>
            $vendorOrder->id,

            'product_sku_id' => $sku->id,
            'quantity' => 3,
            'price' => '500000.00',
        ]);

        return [
            'customer' => $customer,
            'vendor' => $vendor,
            'sku' => $sku,
            'order' => $order,
            'vendorOrder' => $vendorOrder,
            'orderItem' => $orderItem,
        ];
    }
}
