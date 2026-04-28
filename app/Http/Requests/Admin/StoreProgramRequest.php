<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authRole = $this->user()->roles->first()?->slug ?? '';
        return $authRole === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:200',
            'code' => 'required|string|max:20|unique:programs,code',
        ];
    }
}
