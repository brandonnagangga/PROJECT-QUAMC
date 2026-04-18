<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReturnSubAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user->hasRole('dean') || $user->hasRole('director');
    }

    public function rules(): array
    {
        return [
            'comment' => 'nullable|string|max:500',
        ];
    }
}
