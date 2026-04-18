<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ThemeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThemeController extends Controller
{
    public function __construct(
        protected ThemeService $themeService
    ) {}
    
    /**
     * Show theme management page.
     */
    public function index()
    {
        return Inertia::render('Admin/Theme', [
            'themeConfig' => $this->themeService->getThemeConfig(),
            'seasonalThemes' => $this->themeService->getSeasonalThemes(),
        ]);
    }
    
    /**
     * Update theme settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme_mode' => 'required|in:minimalist,themed,seasonal',
            'theme_primary_color' => 'required|string',
            'theme_secondary_color' => 'required|string',
            'seasonal_theme' => 'required|in:default,christmas,newyear,valentine,halloween',
            'seasonal_theme_enabled' => 'required|boolean',
        ]);
        
        $this->themeService->updateTheme([
            'theme_mode' => $validated['theme_mode'],
            'theme_primary_color' => $validated['theme_primary_color'],
            'theme_secondary_color' => $validated['theme_secondary_color'],
            'seasonal_theme' => $validated['seasonal_theme'],
            'seasonal_theme_enabled' => $validated['seasonal_theme_enabled'] ? 'true' : 'false',
        ]);
        
        return back()->with('success', 'Theme updated successfully');
    }
}
