<?php

namespace App\Services;

use App\Models\Setting;

class SettingsService
{
    /**
     * Get all settings with defaults.
     */
    public function getAllSettings(): array
    {
        $defaults = [
            'institution' => 'State University',
            'academicYear' => '2024-2025',
            'accreditationBody' => 'AACCUP',
            'systemName' => 'QUAMC',
            'sessionTimeout' => '60',
            'maxFileSize' => '50',
            'allowedExtensions' => 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,png',
            'storageLimit' => '10',
            'emailNotifications' => '1',
            'documentSubmitted' => '1',
            'documentApproved' => '1',
            'documentReturned' => '1',
            'deadlineReminder' => '1',
        ];

        $saved = Setting::allAsArray();
        return array_merge($defaults, $saved);
    }

    /**
     * Update multiple settings.
     */
    public function updateSettings(array $data): void
    {
        foreach ($data as $key => $value) {
            Setting::setValue($key, $value);
        }
    }

    /**
     * Get a single setting value.
     */
    public function getSetting(string $key, $default = null)
    {
        return Setting::getValue($key, $default);
    }

    /**
     * Set a single setting value.
     */
    public function setSetting(string $key, $value): void
    {
        Setting::setValue($key, $value);
    }
}
