<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'institution' => 'nullable|string|max:255',
            'academicYear' => 'nullable|string|max:20',
            'accreditationBody' => 'nullable|string|max:120',
            'systemName' => 'nullable|string|max:60',
            'sessionTimeout' => 'nullable|string|max:10',
            'maxFileSize' => 'nullable|string|max:10',
            'allowedExtensions' => 'nullable|string|max:500',
            'storageLimit' => 'nullable|string|max:10',
            'emailNotifications' => 'nullable|string',
            'documentSubmitted' => 'nullable|string',
            'documentApproved' => 'nullable|string',
            'documentReturned' => 'nullable|string',
            'deadlineReminder' => 'nullable|string',
        ];
    }
}
