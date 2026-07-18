<?php

namespace App\Http\Requests;

use App\Models\Promotion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StorePromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows(
            'create',
            Promotion::class,
        );
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'campaign_type' => [
                'required',
                Rule::in([
                    Promotion::CAMPAIGN_TWIN_DATE,
                    Promotion::CAMPAIGN_START_MONTH,
                    Promotion::CAMPAIGN_END_MONTH,
                    Promotion::CAMPAIGN_HOLIDAY,
                    Promotion::CAMPAIGN_CELEBRATION,
                    Promotion::CAMPAIGN_CUSTOM,
                ]),
            ],

            'discount_type' => [
                'required',
                Rule::in([
                    Promotion::DISCOUNT_PERCENTAGE,
                    Promotion::DISCOUNT_FIXED,
                ]),
            ],

            'discount_value' => [
                'required',
                'numeric',
                'min:0.01',

                Rule::when(
                    $this->input('discount_type')
                        === Promotion::DISCOUNT_PERCENTAGE,
                    [
                        'max:100',
                    ],
                ),
            ],

            'minimum_order_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'maximum_discount_amount' => [
                'nullable',
                'numeric',
                'min:0.01',
            ],

            'starts_at' => [
                'required',
                'date',
            ],

            'ends_at' => [
                'required',
                'date',
                'after:starts_at',
            ],

            'priority' => [
                'required',
                'integer',
                'min:0',
                'max:100000',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],

            'product_ids' => [
                'required',
                'array',
                'min:1',
                'max:500',
            ],

            'product_ids.*' => [
                'required',
                'integer',
                'distinct',

                Rule::exists(
                    'products',
                    'id',
                )->whereNull(
                    'deleted_at',
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' =>
            'Nama promo wajib diisi.',

            'campaign_type.required' =>
            'Jenis kampanye wajib dipilih.',

            'discount_type.required' =>
            'Jenis diskon wajib dipilih.',

            'discount_value.required' =>
            'Nilai diskon wajib diisi.',

            'discount_value.max' =>
            'Diskon persentase tidak boleh lebih dari 100%.',

            'starts_at.required' =>
            'Waktu mulai promo wajib diisi.',

            'ends_at.required' =>
            'Waktu berakhir promo wajib diisi.',

            'ends_at.after' =>
            'Waktu berakhir harus setelah waktu mulai.',

            'product_ids.required' =>
            'Pilih minimal satu produk.',

            'product_ids.min' =>
            'Pilih minimal satu produk.',

            'product_ids.*.exists' =>
            'Salah satu produk yang dipilih tidak tersedia.',
        ];
    }
}
