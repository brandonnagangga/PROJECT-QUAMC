<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AddUserToProgramRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authRole = $this->user()->roles->first()?->slug ?? '';
        return $authRole === 'admin';
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
        ];
    }
}
