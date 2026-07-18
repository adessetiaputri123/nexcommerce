<?php

namespace App\Http\Requests;

use App\Models\Cart;
use App\Models\ProductSku;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'create',
            Cart::class,
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'product_sku_id' => [
                'required',
                'integer',
                'exists:product_skus,id',
            ],

            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $skuId = $this->input('product_sku_id');
                $quantity = (int) $this->input('quantity', 0);

                if (!$skuId) {
                    return;
                }

                $sku = ProductSku::with('product')->find($skuId);

                if (!$sku) {
                    return;
                }

                if (!$sku->product) {
                    $validator->errors()->add(
                        'product_sku_id',
                        'Produk sudah tidak tersedia.',
                    );

                    return;
                }

                if ($sku->stock <= 0) {
                    $validator->errors()->add(
                        'quantity',
                        'Stok produk sudah habis.',
                    );

                    return;
                }

                if ($quantity > $sku->stock) {
                    $validator->errors()->add(
                        'quantity',
                        "Stok hanya tersedia {$sku->stock}.",
                    );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'product_sku_id.required' =>
            'Varian produk wajib dipilih.',

            'product_sku_id.integer' =>
            'Varian produk tidak valid.',

            'product_sku_id.exists' =>
            'Varian produk tidak ditemukan.',

            'quantity.required' =>
            'Jumlah produk wajib diisi.',

            'quantity.integer' =>
            'Jumlah produk harus berupa bilangan bulat.',

            'quantity.min' =>
            'Jumlah produk minimal satu.',

            'quantity.max' =>
            'Jumlah produk maksimal 99.',
        ];
    }
}
