<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreProductRequest extends FormRequest
{
    /**
     * Memeriksa izin membuat produk melalui ProductPolicy.
     */
    public function authorize(): bool
    {
        return $this->user()?->can(
            'create',
            Product::class,
        ) ?? false;
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

            'skus.*.sku' => [
                'required',
                'string',
                'max:255',
                'distinct',
                Rule::unique('product_skus', 'sku'),
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
     * Pesan validasi berbahasa Indonesia.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi.',

            'name.string' => 'Nama produk harus berupa teks.',

            'name.max' => 'Nama produk maksimal 255 karakter.',

            'description.string' => 'Deskripsi produk harus berupa teks.',

            'skus.required' => 'Produk harus memiliki minimal satu SKU.',

            'skus.array' => 'Format daftar SKU tidak valid.',

            'skus.min' => 'Produk harus memiliki minimal satu SKU.',

            'skus.*.sku.required' => 'Kode SKU wajib diisi.',

            'skus.*.sku.string' => 'Kode SKU harus berupa teks.',

            'skus.*.sku.max' => 'Kode SKU maksimal 255 karakter.',

            'skus.*.sku.distinct' => 'Kode SKU tidak boleh sama.',

            'skus.*.sku.unique' => 'Kode SKU sudah digunakan.',

            'skus.*.price.required' => 'Harga wajib diisi.',

            'skus.*.price.numeric' => 'Harga harus berupa angka.',

            'skus.*.price.min' => 'Harga tidak boleh kurang dari nol.',

            'skus.*.stock.required' => 'Stok wajib diisi.',

            'skus.*.stock.integer' => 'Stok harus berupa bilangan bulat.',

            'skus.*.stock.min' => 'Stok tidak boleh kurang dari nol.',
        ];
    }
}
