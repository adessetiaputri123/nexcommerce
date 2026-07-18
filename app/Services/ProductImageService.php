<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ProductImageService
{
    public const MAX_IMAGES_PER_PRODUCT = 8;

    /**
     * @param array<int, UploadedFile> $images
     *
     * @return Collection<int, ProductImage>
     */
    public function storeMany(
        Product $product,
        array $images,
    ): Collection {
        if ($images === []) {
            return collect();
        }

        /*
         * Validasi semua file terlebih dahulu sebelum
         * ada file yang disimpan ke storage.
         */
        foreach (
            array_values($images)
            as $index => $uploadedFile
        ) {
            if (
                !$uploadedFile instanceof UploadedFile
                || !$uploadedFile->isValid()
            ) {
                throw ValidationException::withMessages([
                    "images.{$index}" =>
                    'File gambar tidak valid.',
                ]);
            }
        }

        $storedPaths = [];

        try {
            return DB::transaction(
                function () use (
                    $product,
                    $images,
                    &$storedPaths,
                ): Collection {
                    /*
                     * Kunci produk untuk mencegah dua proses
                     * upload bersamaan melewati batas foto.
                     */
                    $lockedProduct = Product::query()
                        ->whereKey($product->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $existingImageCount =
                        ProductImage::query()
                        ->where(
                            'product_id',
                            $lockedProduct->id,
                        )
                        ->count();

                    $newImageCount =
                        count($images);

                    if (
                        $existingImageCount
                        + $newImageCount
                        > self::MAX_IMAGES_PER_PRODUCT
                    ) {
                        throw ValidationException::withMessages([
                            'images' =>
                            'Maksimal '
                                . self::MAX_IMAGES_PER_PRODUCT
                                . ' foto untuk satu produk.',
                        ]);
                    }

                    $lastSortOrder =
                        ProductImage::query()
                        ->where(
                            'product_id',
                            $lockedProduct->id,
                        )
                        ->max('sort_order');

                    $nextSortOrder =
                        $lastSortOrder === null
                        ? 0
                        : (int) $lastSortOrder + 1;

                    $hasPrimaryImage =
                        ProductImage::query()
                        ->where(
                            'product_id',
                            $lockedProduct->id,
                        )
                        ->where(
                            'is_primary',
                            true,
                        )
                        ->exists();

                    $createdImages =
                        collect();

                    foreach (
                        array_values($images)
                        as $index => $uploadedFile
                    ) {
                        $path = $uploadedFile->store(
                            "products/{$lockedProduct->id}",
                            'public',
                        );

                        if (
                            !is_string($path)
                            || $path === ''
                        ) {
                            throw new RuntimeException(
                                'Gambar produk gagal disimpan.',
                            );
                        }

                        $storedPaths[] = $path;

                        $isPrimary =
                            !$hasPrimaryImage
                            && $index === 0;

                        $productImage =
                            ProductImage::query()
                            ->create([
                                'product_id' =>
                                $lockedProduct->id,

                                'image_path' =>
                                $path,

                                'alt_text' =>
                                $lockedProduct->name,

                                'sort_order' =>
                                $nextSortOrder
                                    + $index,

                                'is_primary' =>
                                $isPrimary,
                            ]);

                        if ($isPrimary) {
                            $hasPrimaryImage = true;
                        }

                        $createdImages->push(
                            $productImage,
                        );
                    }

                    return $createdImages;
                },
                attempts: 5,
            );
        } catch (Throwable $exception) {
            /*
             * Record database otomatis dibatalkan oleh
             * transaksi. File storage harus dibersihkan
             * secara manual.
             */
            if ($storedPaths !== []) {
                Storage::disk('public')
                    ->delete($storedPaths);
            }

            throw $exception;
        }
    }

    public function setPrimary(
        Product $product,
        ProductImage $image,
    ): ProductImage {
        return DB::transaction(
            function () use (
                $product,
                $image,
            ): ProductImage {
                /*
                 * Ambil ulang foto dengan lock agar aman
                 * dari proses hapus secara bersamaan.
                 */
                $lockedImage =
                    ProductImage::query()
                    ->whereKey($image->id)
                    ->where(
                        'product_id',
                        $product->id,
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$lockedImage) {
                    throw ValidationException::withMessages([
                        'image' =>
                        'Foto tidak ditemukan pada produk tersebut.',
                    ]);
                }

                /*
                 * Tidak perlu menjalankan update apabila
                 * foto tersebut sudah menjadi foto utama.
                 */
                if ($lockedImage->is_primary) {
                    return $lockedImage;
                }

                ProductImage::query()
                    ->where(
                        'product_id',
                        $product->id,
                    )
                    ->where(
                        'is_primary',
                        true,
                    )
                    ->update([
                        'is_primary' =>
                        false,
                    ]);

                $lockedImage->update([
                    'is_primary' =>
                    true,
                ]);

                return $lockedImage->fresh();
            },
            attempts: 5,
        );
    }

    public function delete(
        ProductImage $image,
    ): void {
        $imagePath = DB::transaction(
            function () use (
                $image,
            ): string {
                /*
                 * Ambil ulang foto dengan lock agar data
                 * tidak berubah selama proses penghapusan.
                 */
                $lockedImage =
                    ProductImage::query()
                    ->whereKey($image->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $productId =
                    (int) $lockedImage->product_id;

                $path =
                    (string) $lockedImage->image_path;

                $lockedImage->delete();

                /*
                 * Periksa apakah produk masih mempunyai
                 * foto utama setelah penghapusan.
                 */
                $hasPrimaryImage =
                    ProductImage::query()
                    ->where(
                        'product_id',
                        $productId,
                    )
                    ->where(
                        'is_primary',
                        true,
                    )
                    ->exists();

                /*
                 * Bila tidak ada foto utama, foto dengan
                 * urutan paling awal otomatis dipilih.
                 */
                if (!$hasPrimaryImage) {
                    $nextImage =
                        ProductImage::query()
                        ->where(
                            'product_id',
                            $productId,
                        )
                        ->orderBy(
                            'sort_order',
                        )
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->first();

                    if ($nextImage) {
                        $nextImage->update([
                            'is_primary' =>
                            true,
                        ]);
                    }
                }

                return $path;
            },
            attempts: 5,
        );

        /*
         * Hapus file setelah transaksi database berhasil.
         */
        if (
            $imagePath !== ''
            && Storage::disk('public')
            ->exists($imagePath)
        ) {
            $deleted =
                Storage::disk('public')
                ->delete($imagePath);

            if (!$deleted) {
                Log::warning(
                    'File foto produk gagal dihapus dari storage.',
                    [
                        'image_id' =>
                        $image->id,

                        'image_path' =>
                        $imagePath,
                    ],
                );
            }
        }
    }
}
