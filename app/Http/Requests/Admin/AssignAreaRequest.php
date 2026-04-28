<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'area_ids' => 'required|array|min:1',
            'area_ids.*' => 'required|exists:areas,id',
            'role_type' => 'required|string',
            'academic_year' => 'required|string',
        ];
    }
}
