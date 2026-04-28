<?php

namespace App\Http\Requests\User;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RejectDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'dean') {
            return false;
        }

        $document = $this->route('document');
        return $user->program_id === $document->program_id;
    }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|max:500',
        ];
    }
}
