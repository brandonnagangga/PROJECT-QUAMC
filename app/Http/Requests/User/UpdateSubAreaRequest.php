<?php

namespace App\Http\Requests\User;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSubAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('director');
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
        ];
    }
}
