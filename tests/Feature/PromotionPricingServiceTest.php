<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductSku;
use App\Models\Promotion;
use App\Services\PromotionPricingService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PromotionPricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private PromotionPricingService $pricingService;

    private Product $product;

    private ProductSku $sku;

    private CarbonImmutable $moment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pricingService = app(
            PromotionPricingService::class,
        );

        $this->moment = CarbonImmutable::parse(
            '2026-07-18 10:00:00',
        );

        $this->product = Product::factory()->create([
            'name' => 'Produk Promo Test',
        ]);

        $this->sku = $this->product
            ->skus()
            ->create([
                'sku' => 'PROMO-TEST-001',
                'price' => 100000,
                'stock' => 100,
            ]);
    }

    public function test_percentage_discount_is_calculated_correctly(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Diskon 20 Persen',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 20,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 2,
            moment: $this->moment,
        );

        $this->assertTrue(
            $result['has_discount'],
        );

        $this->assertSame(
            '100000.00',
            $result['original_unit_price'],
        );

        $this->assertSame(
            '200000.00',
            $result['original_subtotal'],
        );

        $this->assertSame(
            '40000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '80000.00',
            $result['final_unit_price'],
        );

        $this->assertSame(
            '160000.00',
            $result['final_subtotal'],
        );

        $this->assertSame(
            $promotion->id,
            $result['promotion']['id'],
        );
    }

    public function test_fixed_discount_is_applied_per_unit(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Potongan 15 Ribu',

            'discount_type' =>
            Promotion::DISCOUNT_FIXED,

            'discount_value' => 15000,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 3,
            moment: $this->moment,
        );

        $this->assertSame(
            '300000.00',
            $result['original_subtotal'],
        );

        $this->assertSame(
            '45000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '255000.00',
            $result['final_subtotal'],
        );

        $this->assertSame(
            '85000.00',
            $result['final_unit_price'],
        );
    }

    public function test_percentage_discount_respects_maximum_discount_amount(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Diskon 50 Persen Maksimal 30 Ribu',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 50,

            'maximum_discount_amount' =>
            30000,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 2,
            moment: $this->moment,
        );

        $this->assertSame(
            '200000.00',
            $result['original_subtotal'],
        );

        $this->assertSame(
            '30000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '170000.00',
            $result['final_subtotal'],
        );

        $this->assertSame(
            '85000.00',
            $result['final_unit_price'],
        );
    }

    public function test_promotion_is_not_applied_when_minimum_amount_is_not_met(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Minimal Belanja 250 Ribu',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 25,

            'minimum_order_amount' =>
            250000,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 2,
            moment: $this->moment,
        );

        $this->assertFalse(
            $result['has_discount'],
        );

        $this->assertNull(
            $result['promotion'],
        );

        $this->assertSame(
            '0.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '200000.00',
            $result['final_subtotal'],
        );
    }

    public function test_promotion_is_not_applied_outside_schedule(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Promo Belum Dimulai',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 50,

            'starts_at' =>
            $this->moment->addDay(),

            'ends_at' =>
            $this->moment->addDays(2),
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 1,
            moment: $this->moment,
        );

        $this->assertFalse(
            $result['has_discount'],
        );

        $this->assertNull(
            $result['promotion'],
        );

        $this->assertSame(
            '100000.00',
            $result['final_subtotal'],
        );
    }

    public function test_inactive_promotion_is_not_applied(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Promo Nonaktif',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 50,

            'is_active' => false,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 1,
            moment: $this->moment,
        );

        $this->assertFalse(
            $result['has_discount'],
        );

        $this->assertSame(
            '0.00',
            $result['discount_amount'],
        );
    }

    public function test_promotion_with_highest_priority_is_selected(): void
    {
        $largeDiscount = $this->createPromotion([
            'name' => 'Diskon 40 Persen',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 40,

            'priority' => 5,
        ]);

        $highPriority = $this->createPromotion([
            'name' => 'Promo Prioritas Utama',

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' => 10,

            'priority' => 100,
        ]);

        $this->attachPromotion(
            $largeDiscount,
        );

        $this->attachPromotion(
            $highPriority,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 1,
            moment: $this->moment,
        );

        $this->assertTrue(
            $result['has_discount'],
        );

        $this->assertSame(
            $highPriority->id,
            $result['promotion']['id'],
        );

        $this->assertSame(
            '10000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '90000.00',
            $result['final_subtotal'],
        );
    }

    public function test_largest_discount_is_selected_when_priority_is_equal(): void
    {
        $discountTenPercent =
            $this->createPromotion([
                'name' => 'Diskon 10 Persen',

                'discount_type' =>
                Promotion::DISCOUNT_PERCENTAGE,

                'discount_value' => 10,

                'priority' => 10,
            ]);

        $discountThirtyPercent =
            $this->createPromotion([
                'name' => 'Diskon 30 Persen',

                'discount_type' =>
                Promotion::DISCOUNT_PERCENTAGE,

                'discount_value' => 30,

                'priority' => 10,
            ]);

        $this->attachPromotion(
            $discountTenPercent,
        );

        $this->attachPromotion(
            $discountThirtyPercent,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 1,
            moment: $this->moment,
        );

        $this->assertSame(
            $discountThirtyPercent->id,
            $result['promotion']['id'],
        );

        $this->assertSame(
            '30000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '70000.00',
            $result['final_subtotal'],
        );
    }

    public function test_discount_cannot_make_final_price_negative(): void
    {
        $promotion = $this->createPromotion([
            'name' => 'Potongan Melebihi Harga',

            'discount_type' =>
            Promotion::DISCOUNT_FIXED,

            'discount_value' => 500000,
        ]);

        $this->attachPromotion(
            $promotion,
        );

        $result = $this->pricingService->calculate(
            sku: $this->sku,
            quantity: 1,
            moment: $this->moment,
        );

        $this->assertSame(
            '100000.00',
            $result['discount_amount'],
        );

        $this->assertSame(
            '0.00',
            $result['final_unit_price'],
        );

        $this->assertSame(
            '0.00',
            $result['final_subtotal'],
        );
    }

    public function test_quantity_must_be_at_least_one(): void
    {
        try {
            $this->pricingService->calculate(
                sku: $this->sku,
                quantity: 0,
                moment: $this->moment,
            );

            $this->fail(
                'ValidationException seharusnya dilempar.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'quantity',
                $exception->errors(),
            );

            $this->assertSame(
                'Jumlah produk minimal 1.',
                $exception->errors()['quantity'][0],
            );
        }
    }

    private function createPromotion(
        array $overrides = [],
    ): Promotion {
        return Promotion::query()->create([
            'name' =>
            'Promo Test',

            'description' =>
            'Promo untuk automated test.',

            'campaign_type' =>
            Promotion::CAMPAIGN_CUSTOM,

            'discount_type' =>
            Promotion::DISCOUNT_PERCENTAGE,

            'discount_value' =>
            10,

            'minimum_order_amount' =>
            null,

            'maximum_discount_amount' =>
            null,

            'starts_at' =>
            $this->moment->subHour(),

            'ends_at' =>
            $this->moment->addHour(),

            'priority' =>
            0,

            'is_active' =>
            true,

            ...$overrides,
        ]);
    }

    private function attachPromotion(
        Promotion $promotion,
    ): void {
        $this->product
            ->promotions()
            ->attach(
                $promotion->id,
            );
    }
}
