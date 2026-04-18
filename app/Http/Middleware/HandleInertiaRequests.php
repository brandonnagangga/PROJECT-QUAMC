<?php

namespace App\Http\Middleware;

use App\Models\AccreditationCycle;
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
            'active_cycle' => $activeCycle ? [
                'id' => $activeCycle->id,
                'name' => $activeCycle->name,
                'academic_year' => $activeCycle->academic_year,
            ] : null,
        ];
    }
}
