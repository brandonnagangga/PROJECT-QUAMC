<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class ThemeService
{
    /**
     * Get current theme configuration.
     */
    public function getThemeConfig(): array
    {
        return Cache::remember('theme_config', 3600, function () {
            $mode = Setting::where('key', 'theme_mode')->value('value') ?? 'themed';
            $seasonalEnabled = Setting::where('key', 'seasonal_theme_enabled')->value('value') === 'true';
            
            // If seasonal is enabled, override mode
            if ($seasonalEnabled) {
                $mode = 'seasonal';
            }
            
            return [
                'mode' => $mode,
                'primary_color' => Setting::where('key', 'theme_primary_color')->value('value') ?? '#185FA5',
                'secondary_color' => Setting::where('key', 'theme_secondary_color')->value('value') ?? '#1a7a4a',
                'seasonal_theme' => Setting::where('key', 'seasonal_theme')->value('value') ?? 'default',
                'seasonal_enabled' => $seasonalEnabled,
            ];
        });
    }
    
    /**
     * Update theme settings.
     */
    public function updateTheme(array $data): void
    {
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
        
        Cache::forget('theme_config');
    }
    
    /**
     * Get available seasonal themes.
     */
    public function getSeasonalThemes(): array
    {
        return [
            'default' => 'Default',
            'christmas' => 'Christmas',
            'newyear' => 'New Year',
            'valentine' => 'Valentine',
            'halloween' => 'Halloween',
        ];
    }
}
