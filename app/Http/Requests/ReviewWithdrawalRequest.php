<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => [
                'required',
                'string',
                Rule::in([
                    'approve',
                    'reject',
                    'paid',
                ]),
            ],

            'review_note' => [
                'nullable',
                'string',
                'max:1000',
                'required_if:action,reject',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' =>
            'Tindakan wajib dipilih.',

            'action.in' =>
            'Tindakan penarikan tidak valid.',

            'review_note.required_if' =>
            'Alasan penolakan wajib diisi.',

            'review_note.max' =>
            'Catatan maksimal 1000 karakter.',
        ];
    }
}
