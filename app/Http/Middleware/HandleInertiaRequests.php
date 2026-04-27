<?php

namespace App\Http\Middleware;

use App\Models\AccreditationCycle;
use App\Services\SettingsService;
use App\Services\ThemeService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $activeCycle = AccreditationCycle::active();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? $request->user()->load('roles') : null,
            ],
            'theme' => app(ThemeService::class)->getThemeConfig(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications_count' => fn () => $request->user()
                ? $request->user()->unreadNotificationsCount()
                : 0,
            'system_settings' => fn () => $request->user()
                ? app(SettingsService::class)->getAllSettings()
                : [],
            'dashboard_preferences' => fn () => $request->user()
                ? ($request->user()->dashboard_preferences ?? [
                    'hidden_widgets' => [],
                    'is_edit_mode' => false,
                ])
                : [
                    'hidden_widgets' => [],
                    'is_edit_mode' => false,
                ],
            'active_cycle' => $activeCycle ? [
                'id' => $activeCycle->id,
                'name' => $activeCycle->name,
                'academic_year' => $activeCycle->academic_year,
            ] : null,
        ];
    }
}
