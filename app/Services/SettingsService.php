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
        $defaults = config('system_settings.defaults', []);

        $saved = Setting::allAsArray();
        $settings = array_merge($defaults, $saved);
        $logoPath = (string) ($settings['appLogoPath'] ?? '');
        $settings['appLogoUrl'] = $logoPath !== ''
            ? route('settings.logo', [], false) . '?v=' . md5($logoPath)
            : '';

        return $settings;
    }

    /**
     * Get the settings schema used by the UI.
     */
    public function getSettingsSchema(): array
    {
        return config('system_settings.schema', []);
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
