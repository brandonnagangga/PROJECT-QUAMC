<?php

namespace App\Http\Requests\User;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSubAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('director');
    }

    public function rules(): array
    {
        return [
            'area_id'      => 'required|exists:areas,id',
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
        ];
    }
}
