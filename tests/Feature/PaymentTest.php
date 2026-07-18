<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_pay_unpaid_order(): void
    {
        $data = $this->createPaymentData();

        $response = $this
            ->actingAs($data['customer'])
            ->post(
                route(
                    'orders.pay',
                    $data['order'],
                ),
            );

        $response->assertSessionHasNoErrors();

        $response->assertRedirect(
            route(
                'orders.show',
                $data['order'],
            ),
        );

        $order = $data['order']->fresh();

        $this->assertSame(
            'paid',
            $order->payment_status,
        );

        $this->assertNotNull(
            $order->payment_reference,
        );

        $this->assertStringStartsWith(
            'SIM-',
            $order->payment_reference,
        );

        $this->assertNotNull(
            $order->paid_at,
        );

        $this->assertSame(
            'confirmed',
            $data['vendorOrder']
                ->fresh()
                ->delivery_status,
        );

        $this->assertDatabaseHas(
            'activity_logs',
            [
                'actor_id' =>
                $data['customer']->id,

                'action' =>
                'payment.completed',

                'subject_type' =>
                Order::class,

                'subject_id' =>
                $order->id,
            ],
        );
    }

    public function test_payment_is_idempotent(): void
    {
        $data = $this->createPaymentData();

        $paymentService = app(
            PaymentService::class,
        );

        $firstPayment = $paymentService->pay(
            order: $data['order'],
            actor: $data['customer'],
        );

        $firstReference =
            $firstPayment->payment_reference;

        $firstPaidAt =
            $firstPayment->paid_at
            ?->toDateTimeString();

        $secondPayment = $paymentService->pay(
            order: $data['order']->fresh(),
            actor: $data['customer'],
        );

        $this->assertSame(
            'paid',
            $secondPayment->payment_status,
        );

        $this->assertSame(
            $firstReference,
            $secondPayment->payment_reference,
        );

        $this->assertSame(
            $firstPaidAt,
            $secondPayment->paid_at
                ?->toDateTimeString(),
        );

        $this->assertSame(
            'confirmed',
            $data['vendorOrder']
                ->fresh()
                ->delivery_status,
        );

        $this->assertSame(
            1,
            ActivityLog::query()
                ->where(
                    'action',
                    'payment.completed',
                )
                ->where(
                    'subject_type',
                    Order::class,
                )
                ->where(
                    'subject_id',
                    $data['order']->id,
                )
                ->count(),
        );
    }

    public function test_expired_order_cannot_be_paid(): void
    {
        $data = $this->createPaymentData(
            paymentStatus: 'expired',
            expiresAt: now()->subMinute(),
            alreadyExpired: true,
        );

        try {
            app(PaymentService::class)->pay(
                order: $data['order'],
                actor: $data['customer'],
            );

            $this->fail(
                'Order expired seharusnya tidak dapat dibayar.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'payment',
                $exception->errors(),
            );
        }

        $order = $data['order']->fresh();

        $this->assertSame(
            'expired',
            $order->payment_status,
        );

        $this->assertNull(
            $order->payment_reference,
        );

        $this->assertNull(
            $order->paid_at,
        );

        $this->assertSame(
            'cancelled',
            $data['vendorOrder']
                ->fresh()
                ->delivery_status,
        );

        $this->assertDatabaseMissing(
            'activity_logs',
            [
                'action' =>
                'payment.completed',

                'subject_type' =>
                Order::class,

                'subject_id' =>
                $order->id,
            ],
        );
    }

    public function test_past_due_unpaid_order_cannot_be_paid(): void
    {
        $data = $this->createPaymentData(
            paymentStatus: 'unpaid',
            expiresAt: now()->subMinute(),
        );

        $response = $this
            ->actingAs($data['customer'])
            ->from(
                route(
                    'orders.show',
                    $data['order'],
                ),
            )
            ->post(
                route(
                    'orders.pay',
                    $data['order'],
                ),
            );

        $response->assertSessionHasErrors([
            'payment',
        ]);

        $order = $data['order']->fresh();

        $this->assertSame(
            'unpaid',
            $order->payment_status,
        );

        $this->assertNull(
            $order->payment_reference,
        );

        $this->assertNull(
            $order->paid_at,
        );

        $this->assertSame(
            'pending',
            $data['vendorOrder']
                ->fresh()
                ->delivery_status,
        );

        $this->assertDatabaseMissing(
            'activity_logs',
            [
                'action' =>
                'payment.completed',

                'subject_type' =>
                Order::class,

                'subject_id' =>
                $order->id,
            ],
        );
    }

    private function createPaymentData(
        string $paymentStatus = 'unpaid',
        mixed $expiresAt = null,
        bool $alreadyExpired = false,
    ): array {
        $customer = User::factory()->create([
            'name' => 'Customer Pembayaran',

            'email' => fake()
                ->unique()
                ->safeEmail(),

            'email_verified_at' => now(),
            'role' => 'customer',
            'vendor_id' => null,
        ]);

        $vendorOwner = User::factory()->create([
            'name' => 'Pemilik Toko Pembayaran',

            'email' => fake()
                ->unique()
                ->safeEmail(),

            'email_verified_at' => now(),
        ]);

        $vendor = Vendor::forceCreate([
            'owner_id' => $vendorOwner->id,
            'shop_name' => 'Toko Pembayaran',
        ]);

        $order = Order::forceCreate([
            'customer_id' => $customer->id,
            'grand_total' => '1500000.00',
            'payment_status' => $paymentStatus,
            'payment_reference' => null,
            'paid_at' => null,

            'expires_at' =>
            $expiresAt
                ?? now()->addMinutes(10),

            'expired_at' =>
            $alreadyExpired
                ? now()
                : null,

            'stock_restored_at' =>
            $alreadyExpired
                ? now()
                : null,
        ]);

        $vendorOrder = VendorOrder::forceCreate([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'subtotal' => '1500000.00',
            'shipping_cost' => '0.00',

            'delivery_status' =>
            $alreadyExpired
                ? 'cancelled'
                : 'pending',
        ]);

        return [
            'customer' => $customer,
            'vendorOwner' => $vendorOwner,
            'vendor' => $vendor,
            'order' => $order,
            'vendorOrder' => $vendorOrder,
        ];
    }
}
