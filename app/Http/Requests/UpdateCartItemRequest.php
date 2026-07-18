<?php

namespace App\Http\Requests;

use App\Models\CartItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $cartItem = $this->route('cartItem');

        return $cartItem instanceof CartItem
            && $this->user()
            && $this->user()->can('update', $cartItem);
    }

    public function rules(): array
    {
        return [
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
                $cartItem = $this->route('cartItem');

                if (!$cartItem instanceof CartItem) {
                    return;
                }

                $cartItem->load('productSku.product');

                $sku = $cartItem->productSku;

                if (!$sku || !$sku->product) {
                    $validator->errors()->add(
                        'quantity',
                        'Produk sudah tidak tersedia.',
                    );

                    return;
                }

                $quantity = (int) $this->input(
                    'quantity',
                    0,
                );

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
