<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\ProductSku;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rules\File;

class UpdateProductRequest extends FormRequest
{
    /**
     * Memeriksa hak akses melalui ProductPolicy.
     */
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && $this->user()
            && $this->user()->can('update', $product);
    }

    /**
     * Aturan validasi produk dan SKU.
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'skus' => [
                'required',
                'array',
                'min:1',
            ],

            /*
             * ID boleh kosong karena SKU baru belum memiliki ID.
             */
            'skus.*.id' => [
                'nullable',
                'integer',
                'distinct',
            ],

            'skus.*.sku' => [
                'required',
                'string',
                'max:255',
                'distinct',
            ],

            'skus.*.price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'skus.*.stock' => [
                'required',
                'integer',
                'min:0',
            ],

            'images' => [
                'nullable',
                'array',
                'max:8',
            ],

            'images.*' => [
                'bail',
                File::image()
                    ->extensions([
                        'jpg',
                        'jpeg',
                        'png',
                        'webp',
                    ])
                    ->max('5mb'),
            ],
        ];
    }

    /**
     * Validasi tambahan untuk kepemilikan dan keunikan SKU.
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $product = $this->route('product');
                $skus = $this->input('skus', []);

                if (! $product instanceof Product) {
                    return;
                }

                foreach ($skus as $index => $skuData) {
                    $skuId = $skuData['id'] ?? null;
                    $skuCode = $skuData['sku'] ?? null;

                    /*
                     * Jika memiliki ID, pastikan SKU benar-benar milik
                     * produk yang sedang diedit.
                     */
                    if ($skuId) {
                        $belongsToProduct = $product->skus()
                            ->whereKey($skuId)
                            ->exists();

                        if (! $belongsToProduct) {
                            $validator->errors()->add(
                                "skus.{$index}.id",
                                'SKU tersebut bukan milik produk ini.',
                            );

                            continue;
                        }
                    }

                    if (! $skuCode) {
                        continue;
                    }

                    /*
                     * Pastikan kode SKU tidak digunakan varian lain.
                     */
                    $skuAlreadyExists = ProductSku::query()
                        ->where('sku', $skuCode)
                        ->when(
                            $skuId,
                            fn($query) => $query->where(
                                'id',
                                '!=',
                                $skuId,
                            ),
                        )
                        ->exists();

                    if ($skuAlreadyExists) {
                        $validator->errors()->add(
                            "skus.{$index}.sku",
                            'Kode SKU sudah digunakan oleh varian lain.',
                        );
                    }
                }
            },
        ];
    }

    /**
     * Pesan validasi berbahasa Indonesia.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi.',

            'name.max' => 'Nama produk maksimal 255 karakter.',

            'skus.required' => 'Produk harus memiliki minimal satu SKU.',

            'skus.array' => 'Format daftar SKU tidak valid.',

            'skus.min' => 'Produk harus memiliki minimal satu SKU.',

            'skus.*.id.integer' => 'ID SKU tidak valid.',

            'skus.*.id.distinct' => 'Terdapat ID SKU yang sama.',

            'skus.*.sku.required' => 'Kode SKU wajib diisi.',

            'skus.*.sku.distinct' => 'Kode SKU tidak boleh sama.',

            'skus.*.sku.max' => 'Kode SKU maksimal 255 karakter.',

            'skus.*.price.required' => 'Harga wajib diisi.',

            'skus.*.price.numeric' => 'Harga harus berupa angka.',

            'skus.*.price.min' => 'Harga tidak boleh kurang dari nol.',

            'skus.*.stock.required' => 'Stok wajib diisi.',

            'skus.*.stock.integer' => 'Stok harus berupa bilangan bulat.',

            'skus.*.stock.min' => 'Stok tidak boleh kurang dari nol.',
        ];
    }
}
