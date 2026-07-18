<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProductImageServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProductImageService $productImageService;

    private FilesystemAdapter $publicDisk;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        $this->publicDisk = $disk;

        $this->productImageService = app(
            ProductImageService::class,
        );
    }

    public function test_first_uploaded_image_becomes_primary_image(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Test',
        ]);

        $images = [
            UploadedFile::fake()->image(
                'foto-pertama.jpg',
                800,
                800,
            ),
            UploadedFile::fake()->image(
                'foto-kedua.jpg',
                800,
                800,
            ),
        ];

        $createdImages =
            $this->productImageService->storeMany(
                product: $product,
                images: $images,
            );

        $this->assertCount(
            2,
            $createdImages,
        );

        /** @var ProductImage $firstImage */
        $firstImage = $createdImages->first();

        /** @var ProductImage $secondImage */
        $secondImage = $createdImages->last();

        $this->assertTrue(
            (bool) $firstImage->is_primary,
        );

        $this->assertFalse(
            (bool) $secondImage->is_primary,
        );

        $this->assertDatabaseHas(
            'product_images',
            [
                'product_id' =>
                $product->id,

                'is_primary' =>
                true,

                'sort_order' =>
                0,
            ],
        );

        $this->assertDatabaseHas(
            'product_images',
            [
                'product_id' =>
                $product->id,

                'is_primary' =>
                false,

                'sort_order' =>
                1,
            ],
        );

        foreach ($createdImages as $image) {
            $this->assertTrue(
                $this->publicDisk->exists(
                    $image->image_path,
                ),
                "File {$image->image_path} seharusnya tersimpan.",
            );
        }
    }

    public function test_product_cannot_have_more_than_eight_images(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Delapan Foto',
        ]);

        $firstEightImages = collect(
            range(1, 8),
        )
            ->map(
                fn(int $number): UploadedFile =>
                UploadedFile::fake()->image(
                    "foto-{$number}.jpg",
                    800,
                    800,
                ),
            )
            ->all();

        $this->productImageService->storeMany(
            product: $product,
            images: $firstEightImages,
        );

        $this->assertSame(
            8,
            $product->images()->count(),
        );

        $this->assertCount(
            8,
            $this->publicDisk->allFiles(
                "products/{$product->id}",
            ),
        );

        try {
            $this->productImageService->storeMany(
                product: $product,
                images: [
                    UploadedFile::fake()->image(
                        'foto-kesembilan.jpg',
                        800,
                        800,
                    ),
                ],
            );

            $this->fail(
                'ValidationException seharusnya dilempar.',
            );
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey(
                'images',
                $exception->errors(),
            );

            $this->assertSame(
                'Maksimal 8 foto untuk satu produk.',
                $exception->errors()['images'][0],
            );
        }

        $this->assertSame(
            8,
            $product->images()->count(),
        );

        /*
         * Nama file hasil store() dibuat secara acak,
         * sehingga yang diperiksa adalah jumlah file.
         */
        $this->assertCount(
            8,
            $this->publicDisk->allFiles(
                "products/{$product->id}",
            ),
        );
    }

    public function test_an_existing_image_can_become_primary(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Ganti Utama',
        ]);

        $createdImages =
            $this->productImageService->storeMany(
                product: $product,
                images: [
                    UploadedFile::fake()->image(
                        'utama-lama.jpg',
                    ),
                    UploadedFile::fake()->image(
                        'utama-baru.jpg',
                    ),
                ],
            );

        /** @var ProductImage $firstImage */
        $firstImage = $createdImages->first();

        /** @var ProductImage $secondImage */
        $secondImage = $createdImages->last();

        $updatedImage =
            $this->productImageService->setPrimary(
                product: $product,
                image: $secondImage,
            );

        $this->assertTrue(
            (bool) $updatedImage->is_primary,
        );

        $this->assertFalse(
            (bool) $firstImage
                ->fresh()
                ->is_primary,
        );

        $this->assertSame(
            1,
            ProductImage::query()
                ->where(
                    'product_id',
                    $product->id,
                )
                ->where(
                    'is_primary',
                    true,
                )
                ->count(),
        );

        $this->assertDatabaseHas(
            'product_images',
            [
                'id' =>
                $secondImage->id,

                'is_primary' =>
                true,
            ],
        );
    }

    public function test_deleting_primary_image_promotes_next_image(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Hapus Utama',
        ]);

        $createdImages =
            $this->productImageService->storeMany(
                product: $product,
                images: [
                    UploadedFile::fake()->image(
                        'foto-utama.jpg',
                    ),
                    UploadedFile::fake()->image(
                        'foto-berikutnya.jpg',
                    ),
                ],
            );

        /** @var ProductImage $primaryImage */
        $primaryImage = $createdImages->first();

        /** @var ProductImage $nextImage */
        $nextImage = $createdImages->last();

        $primaryImagePath =
            $primaryImage->image_path;

        $this->assertTrue(
            $this->publicDisk->exists(
                $primaryImagePath,
            ),
            'Foto utama seharusnya tersimpan sebelum dihapus.',
        );

        $this->productImageService->delete(
            $primaryImage,
        );

        $this->assertDatabaseMissing(
            'product_images',
            [
                'id' =>
                $primaryImage->id,
            ],
        );

        $this->assertFalse(
            $this->publicDisk->exists(
                $primaryImagePath,
            ),
            'File foto utama seharusnya sudah dihapus.',
        );

        $this->assertTrue(
            (bool) $nextImage
                ->fresh()
                ->is_primary,
        );

        $this->assertSame(
            1,
            ProductImage::query()
                ->where(
                    'product_id',
                    $product->id,
                )
                ->where(
                    'is_primary',
                    true,
                )
                ->count(),
        );

        $this->assertSame(
            1,
            $product->images()->count(),
        );
    }

    public function test_deleting_non_primary_image_keeps_current_primary_image(): void
    {
        $product = Product::factory()->create([
            'name' => 'Produk Hapus Foto Biasa',
        ]);

        $createdImages =
            $this->productImageService->storeMany(
                product: $product,
                images: [
                    UploadedFile::fake()->image(
                        'foto-utama.jpg',
                    ),
                    UploadedFile::fake()->image(
                        'foto-biasa.jpg',
                    ),
                ],
            );

        /** @var ProductImage $primaryImage */
        $primaryImage = $createdImages->first();

        /** @var ProductImage $secondaryImage */
        $secondaryImage = $createdImages->last();

        $secondaryImagePath =
            $secondaryImage->image_path;

        $this->assertTrue(
            $this->publicDisk->exists(
                $secondaryImagePath,
            ),
            'Foto kedua seharusnya tersimpan sebelum dihapus.',
        );

        $this->productImageService->delete(
            $secondaryImage,
        );

        $this->assertDatabaseMissing(
            'product_images',
            [
                'id' =>
                $secondaryImage->id,
            ],
        );

        $this->assertFalse(
            $this->publicDisk->exists(
                $secondaryImagePath,
            ),
            'File foto kedua seharusnya sudah dihapus.',
        );

        $this->assertTrue(
            (bool) $primaryImage
                ->fresh()
                ->is_primary,
        );

        $this->assertSame(
            1,
            $product->images()->count(),
        );

        $this->assertSame(
            1,
            ProductImage::query()
                ->where(
                    'product_id',
                    $product->id,
                )
                ->where(
                    'is_primary',
                    true,
                )
                ->count(),
        );
    }
}
