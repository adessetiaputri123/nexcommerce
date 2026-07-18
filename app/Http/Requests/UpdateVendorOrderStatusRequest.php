<?php

namespace App\Http\Requests;

use App\Models\VendorOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVendorOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $vendorOrder = $this->route(
            'vendorOrder',
        );

        return $vendorOrder instanceof VendorOrder
            && $this->user()
            && $this->user()->can(
                'updateStatus',
                $vendorOrder,
            );
    }

    public function rules(): array
    {
        return [
            'delivery_status' => [
                'required',
                'string',
                Rule::in([
                    'processing',
                    'packed',
                    'shipped',
                    'completed',
                ]),
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $vendorOrder = $this->route(
                    'vendorOrder',
                );

                if (
                    !$vendorOrder instanceof VendorOrder
                ) {
                    return;
                }

                $nextStatus = $this->input(
                    'delivery_status',
                );

                $allowedTransitions = [
                    'confirmed' => ['processing'],
                    'processing' => ['packed'],
                    'packed' => ['shipped'],
                    'shipped' => ['completed'],
                ];

                $allowedStatuses =
                    $allowedTransitions[$vendorOrder->delivery_status] ?? [];

                if (
                    !in_array(
                        $nextStatus,
                        $allowedStatuses,
                        true,
                    )
                ) {
                    $validator->errors()->add(
                        'delivery_status',
                        "Status tidak dapat diubah dari "
                            . "{$vendorOrder->delivery_status} "
                            . "menjadi {$nextStatus}.",
                    );
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'delivery_status.required' =>
            'Status pengiriman wajib dipilih.',

            'delivery_status.in' =>
            'Status pengiriman tidak valid.',
        ];
    }
}
