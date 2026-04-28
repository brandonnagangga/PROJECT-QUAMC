<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'string',
                Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role_id' => 'required|exists:roles,id',
            'program_id' => 'nullable|exists:programs,id',
            'activation_mode' => 'nullable|in:activate_now,email_activation',
            'notify_user' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'password.uncompromised' => 'This password has appeared in a data breach and should not be used.',
        ];
    }
}
