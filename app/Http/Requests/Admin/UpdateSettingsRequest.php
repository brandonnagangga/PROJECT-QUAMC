<?php

namespace App\Http\Requests\Admin;

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
            'appName' => 'nullable|string|max:120',
            'appDetails' => 'nullable|string|max:1000',
            'appLogo' => 'nullable|file|mimes:png,jpg,jpeg,webp,svg|max:2048',
            'socialWebsite' => 'nullable|url|max:500',
            'socialFacebook' => 'nullable|url|max:500',
            'socialLinkedIn' => 'nullable|url|max:500',
            'socialX' => 'nullable|url|max:500',
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
