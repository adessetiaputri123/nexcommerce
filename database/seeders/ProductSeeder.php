<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil data toko 'Tech Gadget Store' yang sudah dibuat oleh IdentitySeeder sebelumnya
        $vendor = Vendor::where('shop_name', 'Tech Gadget Store')->first();

        if ($vendor) {
            // 2. Simulasi Produk Pertama: Laptop ASUS ROG
            $product1 = Product::create([
                'vendor_id' => $vendor->id,
                'name' => 'Laptop ASUS ROG Zephyrus',
                'description' => 'Laptop gaming ultra-tipis dengan performa monster.',
            ]);

            // Tambahkan varian SKU (Anak) untuk Laptop ASUS ROG
            $product1->skus()->createMany([
                [
                    'sku' => 'ROG-ZEPH-R7-RAM16',
                    'price' => 25000000.00,
                    'stock' => 10,
                ],
                [
                    'sku' => 'ROG-ZEPH-R9-RAM32',
                    'price' => 35000000.00,
                    'stock' => 5,
                ],
            ]);

            // 3. Simulasi Produk Kedua: Smartphone Nexus X
            $product2 = Product::create([
                'vendor_id' => $vendor->id,
                'name' => 'Smartphone Nexus X Pro',
                'description' => 'Smartphone flagship dengan kamera cinematic luar biasa.',
            ]);

            // Tambahkan varian SKU (Anak) untuk Smartphone Nexus X
            $product2->skus()->createMany([
                [
                    'sku' => 'NEXUS-X-128GB-BLK',
                    'price' => 12000000.00,
                    'stock' => 50,
                ],
                [
                    'sku' => 'NEXUS-X-256GB-SLV',
                    'price' => 14000000.00,
                    'stock' => 30,
                ],
            ]);
        }
    }
}
