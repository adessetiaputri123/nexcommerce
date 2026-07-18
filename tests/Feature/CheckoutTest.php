<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductSku;
use App\Models\Promotion;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_checkout_creates_master_order_and_splits_vendor_orders(): void
    {
        $customer = $this->createCustomer(
            'Customer Utama',
            'customer@example.com',
        );

        $ownerA = User::factory()->create([
            'name' => 'Pemilik Toko Alpha',
            'email' => 'owner.alpha@example.com',
            'email_verified_at' => now(),
        ]);

        $ownerB = User::factory()->create([
            'name' => 'Pemilik Toko Beta',
            'email' => 'owner.beta@example.com',
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

        $skuA = $this->createSku(
            vendor: $vendorA,
            productName: 'Laptop Alpha',
            skuCode: 'ALPHA-LAPTOP-01',
            price: '1000000.00',
            stock: 10,
        );

        $skuB = $this->createSku(
            vendor: $vendorB,
            productName: 'Smartphone Beta',
            skuCode: 'BETA-PHONE-01',
            price: '1500000.00',
            stock: 5,
        );

        $cart = Cart::forceCreate([
            'customer_id' => $customer->id,
        ]);

        CartItem::forceCreate([
            'cart_id' => $cart->id,
            'product_sku_id' => $skuA->id,
            'quantity' => 2,
            'price_snapshot' => '1000000.00',
        ]);

        CartItem::forceCreate([
            'cart_id' => $cart->id,
            'product_sku_id' => $skuB->id,
            'quantity' => 1,
            'price_snapshot' => '1500000.00',
        ]);

        $response = $this
            ->actingAs($customer)
            ->post(route('checkout.store'));

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('vendor_orders', 2);
        $this->assertDatabaseCount('order_items', 2);

        $order = Order::query()->firstOrFail();

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(
            route('orders.show', $order),
        );

        $this->assertSame(
            $customer->id,
            $order->customer_id,
        );

        $this->assertSame(
            '3500000.00',
            $order->grand_total,
        );

        $this->assertSame(
            'unpaid',
            $order->payment_status,
        );

        $order->load([
            'vendorOrders.items',
        ]);

        $this->assertCount(
            2,
            $order->vendorOrders,
        );

        $vendorOrderA = $order
            ->vendorOrders
            ->firstWhere(
                'vendor_id',
                $vendorA->id,
            );

        $vendorOrderB = $order
            ->vendorOrders
            ->firstWhere(
                'vendor_id',
                $vendorB->id,
            );

        $this->assertNotNull($vendorOrderA);
        $this->assertNotNull($vendorOrderB);

        $this->assertSame(
            '2000000.00',
            $vendorOrderA->subtotal,
        );

        $this->assertSame(
            '1500000.00',
            $vendorOrderB->subtotal,
        );

        $this->assertCount(
            1,
            $vendorOrderA->items,
        );

        $this->assertCount(
            1,
            $vendorOrderB->items,
        );

        $this->assertSame(
            8,
            $skuA->fresh()->stock,
        );

        $this->assertSame(
            4,
            $skuB->fresh()->stock,
        );

        $this->assertDatabaseMissing(
            'cart_items',
            [
                'cart_id' => $cart->id,
            ],
        );
    }

    public function test_checkout_applies_active_promotion_and_stores_promotion_snapshot(): void
    {
        $customer = $this->createCustomer(
            'Customer Promo',
            'customer.promo@example.com',
        );

        $vendorOwner = User::factory()->create([
            'name' => 'Pemilik Toko Promo',
            'email' => 'owner.promo@example.com',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $vendorOwner->id,
            'shop_name' => 'Toko Promo',
        ]);

        $sku = $this->createSku(
            vendor: $vendor,
            productName: 'Produk Promo',
            skuCode: 'PROMO-SKU-01',
            price: '100000.00',
            stock: 10,
        );

        $product = $sku
            ->product()
            ->firstOrFail();

        /*
         * Struktur promo mengikuti helper pada
         * PromotionPricingServiceTest.
         */
        $promotion = Promotion::query()->create([
            'name' =>
            'Promo Checkout 20 Persen',

            'description' =>
            'Promo aktif untuk pengujian checkout.',

            'campaign_type' =>
            Promotion::CAMPAIGN_CUSTOM,

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' =>
            20,

            'minimum_order_amount' =>
            null,

            'maximum_discount_amount' =>
            null,

            'starts_at' =>
            now()->subHour(),

            'ends_at' =>
            now()->addHour(),

            'priority' =>
            100,

            'is_active' =>
            true,
        ]);

        $product
            ->promotions()
            ->attach(
                $promotion->id,
            );

        $cart = Cart::forceCreate([
            'customer_id' => $customer->id,
        ]);

        CartItem::forceCreate([
            'cart_id' => $cart->id,
            'product_sku_id' => $sku->id,
            'quantity' => 2,
            'price_snapshot' => '100000.00',
        ]);

        $response = $this
            ->actingAs($customer)
            ->post(route('checkout.store'));

        $response->assertSessionHasNoErrors();

        $order = Order::query()
            ->with('vendorOrders.items')
            ->firstOrFail();

        $response->assertRedirect(
            route('orders.show', $order),
        );

        $this->assertSame(
            '160000.00',
            $order->grand_total,
        );

        $this->assertCount(
            1,
            $order->vendorOrders,
        );

        $vendorOrder = $order
            ->vendorOrders
            ->first();

        $this->assertNotNull(
            $vendorOrder,
        );

        $this->assertSame(
            $vendor->id,
            $vendorOrder->vendor_id,
        );

        $this->assertSame(
            '160000.00',
            $vendorOrder->subtotal,
        );

        $this->assertCount(
            1,
            $vendorOrder->items,
        );

        $orderItem = $vendorOrder
            ->items
            ->first();

        $this->assertNotNull(
            $orderItem,
        );

        $this->assertSame(
            $sku->id,
            $orderItem->product_sku_id,
        );

        $this->assertSame(
            2,
            $orderItem->quantity,
        );

        $this->assertSame(
            '80000.00',
            $orderItem->price,
        );

        $this->assertSame(
            '100000.00',
            $orderItem->original_price,
        );

        $this->assertSame(
            '20000.00',
            $orderItem->discount_amount,
        );

        $this->assertSame(
            $promotion->id,
            $orderItem->promotion_id,
        );

        $this->assertSame(
            'Promo Checkout 20 Persen',
            $orderItem->promotion_name,
        );

        $this->assertSame(
            Promotion::DISCOUNT_PERCENTAGE,
            $orderItem->promotion_discount_type,
        );

        $this->assertSame(
            '20.00',
            $orderItem->promotion_discount_value,
        );

        $this->assertSame(
            8,
            $sku->fresh()->stock,
        );

        $this->assertDatabaseMissing(
            'cart_items',
            [
                'cart_id' => $cart->id,
            ],
        );
    }

    public function test_checkout_is_rejected_when_stock_is_not_enough(): void
    {
        $customer = $this->createCustomer(
            'Customer Stok',
            'stok@example.com',
        );

        $vendorOwner = User::factory()->create([
            'name' => 'Pemilik Toko Stok',
            'email' => 'owner.stok@example.com',
            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $vendorOwner->id,
            'shop_name' => 'Toko Stok',
        ]);

        $sku = $this->createSku(
            vendor: $vendor,
            productName: 'Produk Stok Terbatas',
            skuCode: 'STOCK-LIMIT-01',
            price: '500000.00',
            stock: 2,
        );

        $cart = Cart::forceCreate([
            'customer_id' => $customer->id,
        ]);

        $cartItem = CartItem::forceCreate([
            'cart_id' => $cart->id,
            'product_sku_id' => $sku->id,
            'quantity' => 3,
            'price_snapshot' => '500000.00',
        ]);

        $response = $this
            ->actingAs($customer)
            ->from(route('checkout.show'))
            ->post(route('checkout.store'));

        $response->assertSessionHasErrors([
            'cart',
        ]);

        $this->assertDatabaseCount(
            'orders',
            0,
        );

        $this->assertDatabaseCount(
            'vendor_orders',
            0,
        );

        $this->assertDatabaseCount(
            'order_items',
            0,
        );

        $this->assertSame(
            2,
            $sku->fresh()->stock,
        );

        $this->assertDatabaseHas(
            'cart_items',
            [
                'id' => $cartItem->id,
                'quantity' => 3,
            ],
        );
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $owner = $this->createCustomer(
            'Pemilik Pesanan',
            'owner@example.com',
        );

        $otherCustomer = $this->createCustomer(
            'Customer Lain',
            'other@example.com',
        );

        $order = Order::forceCreate([
            'customer_id' => $owner->id,
            'grand_total' => '1000000.00',
            'payment_status' => 'unpaid',
        ]);

        $response = $this
            ->actingAs($otherCustomer)
            ->get(route('orders.show', $order));

        $response->assertForbidden();
    }

    private function createCustomer(
        string $name,
        string $email,
    ): User {
        return User::factory()->create([
            'name' => $name,
            'email' => $email,
            'email_verified_at' => now(),
            'role' => 'customer',
            'vendor_id' => null,
        ]);
    }

    private function createSku(
        Vendor $vendor,
        string $productName,
        string $skuCode,
        string $price,
        int $stock,
    ): ProductSku {
        $product = Product::forceCreate([
            'vendor_id' => $vendor->id,
            'name' => $productName,
            'description' =>
            'Produk untuk pengujian checkout.',
        ]);

        return ProductSku::forceCreate([
            'product_id' => $product->id,
            'sku' => $skuCode,
            'price' => $price,
            'stock' => $stock,
        ]);
    }
}
