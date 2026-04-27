<?php

namespace App\Http\Middleware;

use App\Models\AccreditationCycle;
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
        $activeCycle   = AccreditationCycle::active();
        $allCycles     = AccreditationCycle::orderByDesc('start_date')->get();

        // The cycle users are currently VIEWING (defaults to active cycle)
        $viewingId = $request->session()->get('viewing_cycle_id', $activeCycle?->id);
        // If the stored ID no longer exists, fall back to active
        $viewingCycle = $allCycles->firstWhere('id', $viewingId) ?? $activeCycle;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? $request->user()->load('roles') : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'notifications_count' => fn () => $request->user()
                ? $request->user()->unreadNotificationsCount()
                : 0,
            'active_cycle' => $activeCycle ? [
                'id'            => $activeCycle->id,
                'name'          => $activeCycle->name,
                'academic_year' => $activeCycle->academic_year,
            ] : null,
            'viewing_cycle' => $viewingCycle ? [
                'id'            => $viewingCycle->id,
                'name'          => $viewingCycle->name,
                'academic_year' => $viewingCycle->academic_year,
                'is_active'     => $viewingCycle->is_active,
                'start_date'    => $viewingCycle->start_date->format('M j, Y'),
                'end_date'      => $viewingCycle->end_date->format('M j, Y'),
            ] : null,
            'all_cycles' => $allCycles->map(fn ($c) => [
                'id'            => $c->id,
                'name'          => $c->name,
                'academic_year' => $c->academic_year,
                'is_active'     => $c->is_active,
            ]),
            // For program-coordinator: their assigned program ID for the sidebar "My Program" link
            'my_program_id' => fn () => ($request->user() && $request->user()->roles?->first()?->slug === 'program-coordinator')
                ? $request->user()->program_id
                : null,
            // Recent notifications for the header bell dropdown (last 8, unread first)
            'recent_notifications' => fn () => $request->user()
                ? $request->user()->notifications()
                    ->orderBy('is_read')
                    ->orderByDesc('created_at')
                    ->take(8)
                    ->get()
                    ->map(fn ($n) => [
                        'id'       => $n->id,
                        'type'     => $n->type,
                        'message'  => $n->message,
                        'is_read'  => (bool) $n->is_read,
                        'link'     => $n->link ?? null,
                        'time_ago' => $n->created_at->diffForHumans(),
                    ])
                : [],
        ];
    }
}

