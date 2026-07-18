<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),

            'name' => fake()
                ->unique()
                ->words(
                    3,
                    true,
                ),

            'description' => fake()
                ->paragraph(),
        ];
    }
}
