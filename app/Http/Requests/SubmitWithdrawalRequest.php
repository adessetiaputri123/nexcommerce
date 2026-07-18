<?php

namespace App\Http\Requests;

use App\Models\Wallet;
use Illuminate\Foundation\Http\FormRequest;

class SubmitWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $wallet = $this->route('wallet');
        $user = $this->user();

        if (
            !$wallet instanceof Wallet ||
            $user === null
        ) {
            return false;
        }

        $ownerId = $wallet
            ->vendor()
            ->value('owner_id');

        return (int) $ownerId === (int) $user->id;
    }

    public function rules(): array
    {
        return [
            'amount' => [
                'required',
                'numeric',
                'min:1',
            ],

            'bank_name' => [
                'required',
                'string',
                'max:100',
            ],

            'bank_account_name' => [
                'required',
                'string',
                'max:100',
            ],

            'bank_account_number' => [
                'required',
                'string',
                'regex:/^[0-9]{5,50}$/',
            ],

            'vendor_note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' =>
            'Nominal penarikan wajib diisi.',

            'amount.numeric' =>
            'Nominal penarikan harus berupa angka.',

            'amount.min' =>
            'Nominal penarikan harus lebih dari nol.',

            'bank_name.required' =>
            'Nama bank wajib diisi.',

            'bank_account_name.required' =>
            'Nama pemilik rekening wajib diisi.',

            'bank_account_number.required' =>
            'Nomor rekening wajib diisi.',

            'bank_account_number.regex' =>
            'Nomor rekening hanya boleh berisi angka.',

            'vendor_note.max' =>
            'Catatan maksimal 1000 karakter.',
        ];
    }
}
