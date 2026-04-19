<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Document;
use App\Models\Program;
use App\Models\ActivityLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first();

        $stats = $this->getStatsForRole($user, $role?->slug);

        // ── Programs with area completion (based on doc slots: 3 per sub-area) ──
        $programs = Program::where('is_active', true)->get()
            ->map(function ($program) {
                $areas = Area::orderBy('order_number')->get()->map(function ($area) use ($program) {
                    $subAreaIds = $area->subAreas()->pluck('id');
                    $totalSlots    = $subAreaIds->count() * 3; // always 3 slots
                    $approvedSlots = $totalSlots > 0
                        ? Document::whereIn('sub_area_id', $subAreaIds)
                            ->where('program_id', $program->id)
                            ->where('status', 'approved')
                            ->count()
                        : 0;
                    $pct = $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0;
                    return [
                        'name' => preg_replace('/^Area \d+ [–-] /', '', $area->name),
                        'pct'  => $pct,
                        'cls'  => $pct >= 80 ? 'done' : ($pct > 0 ? 'pending' : 'draft'),
                    ];
                });

                return [
                    'id'    => $program->id,
                    'name'  => $program->name,
                    'code'  => $program->code,
                    'pct'   => (int) round($areas->avg('pct')),
                    'areas' => $areas->values()->toArray(),
                ];
            });

        // ── Recent documents (new schema: sub_area + program + doc_type) ──
        $recentDocs = Document::with(['subArea.area', 'program', 'uploader'])
            ->orderByDesc('updated_at')
            ->take(8)
            ->get()
            ->map(fn ($d) => [
                'id'       => $d->id,
                'title'    => $d->title,
                'path'     => trim(($d->subArea?->area?->name ?? '') . ' › ' . ($d->subArea?->name ?? '') . ' › ' . ucfirst($d->doc_type ?? ''), ' › '),
                'prog'     => $d->program?->code ?? '',
                'ver'      => 'v' . ($d->current_version ?? 1),
                'status'   => $d->status === 'pending_review' ? 'pending' : ($d->status ?? 'draft'),
                'date'     => $d->updated_at->format('M j'),
                'uploader' => $d->uploader?->name ?? '',
            ]);

        // ── Recent activity ──
        $activities = ActivityLog::with('user')
            ->orderByDesc('created_at')
            ->take(6)
            ->get()
            ->map(fn ($a) => [
                'icon'  => $this->getEventIcon($a->event),
                'bg'    => $this->getEventBg($a->event),
                'color' => $this->getEventColor($a->event),
                'text'  => '<strong>' . ($a->user?->name ?? 'System') . '</strong> ' . ($a->changes['action'] ?? $a->event),
                'time'  => $a->created_at->diffForHumans(),
            ]);

        // ── Area progress summary for sidebar (global areas) ──
        $areaItems = Area::orderBy('order_number')->get()->map(function ($area) {
            $subAreaIds    = $area->subAreas()->pluck('id');
            $totalSlots    = $subAreaIds->count() * 3;
            $approvedSlots = $totalSlots > 0
                ? Document::whereIn('sub_area_id', $subAreaIds)->where('status', 'approved')->count()
                : 0;
            $pct = $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0;
            return [
                'name'  => $area->name,
                'pct'   => $pct,
                'color' => $this->getAreaColor($area->order_number),
            ];
        });

        $page = match ($role?->slug) {
            'admin'               => 'Dashboard/Admin',
            'director'            => 'Dashboard/Director',
            'dean'                => 'Dashboard/Dean',
            'program-coordinator' => 'Dashboard/Coordinator',
            'area-coordinator'    => 'Dashboard/Coordinator',
            default               => 'Dashboard/Director',
        };

        return Inertia::render($page, [
            'stats'       => $stats,
            'readinessTrend' => $this->buildReadinessTrend(365),
            'programs'    => $programs,
            'recentDocs'  => $recentDocs,
            'activities'  => $activities,
            'areaItems'   => $areaItems,
            'currentRole' => $role?->slug ?? 'director',
            'userCount'   => User::count(),
            'logCount'    => ActivityLog::count(),
        ]);
    }

    private function getStatsForRole($user, ?string $roleSlug): array
    {
        $totalDocs = Document::count();
        $approved  = Document::where('status', 'approved')->count();
        $pending   = Document::where('status', 'pending_review')->count();
        $programs  = Program::where('is_active', true)->count();
        $readiness = $totalDocs > 0 ? round(($approved / $totalDocs) * 100) : 0;

        return [
            'programs'    => (string) $programs,
            'readiness'   => $readiness . '%',
            'readinessSub'=> 'Across all programs',
            'approved'    => (string) $approved,
            'approvedSub' => 'Of ' . $totalDocs . ' total',
            'pending'     => (string) $pending,
            'pendingSub'  => 'Awaiting action',
        ];
    }

    /**
     * Build daily readiness trend (approved/total) for the past N days.
     */
    private function buildReadinessTrend(int $days = 365): array
    {
        $start = now()->subDays($days - 1)->startOfDay();
        $end = now()->endOfDay();

        $dailyCreated = Document::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day')
            ->pluck('count', 'day');

        $dailyApprovedCreated = Document::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->where('status', 'approved')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day')
            ->pluck('count', 'day');

        $runningTotal = Document::where('created_at', '<', $start)->count();
        $runningApproved = Document::where('status', 'approved')
            ->where('created_at', '<', $start)
            ->count();

        $trend = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $start->copy()->addDays($i);
            $dayKey = $day->toDateString();

            $runningTotal += (int) ($dailyCreated[$dayKey] ?? 0);
            $runningApproved += (int) ($dailyApprovedCreated[$dayKey] ?? 0);

            $pct = $runningTotal > 0
                ? (int) round(($runningApproved / $runningTotal) * 100)
                : 0;

            $trend[] = [
                'date' => $dayKey,
                'label' => Carbon::parse($dayKey)->format('M j'),
                'value' => $pct,
            ];
        }

        return $trend;
    }

    private function getEventIcon(string $event): string
    {
        return match (true) {
            str_contains($event, 'approved')  => '✓',
            str_contains($event, 'returned')  => '↩',
            str_contains($event, 'submitted') => '↑',
            str_contains($event, 'uploaded')  => '↑',
            default => '•',
        };
    }

    private function getEventBg(string $event): string
    {
        return match (true) {
            str_contains($event, 'approved'), str_contains($event, 'submitted') => 'var(--success-light)',
            str_contains($event, 'returned') => 'var(--danger-light)',
            str_contains($event, 'uploaded') => 'var(--info-light)',
            default => 'var(--gold-pale)',
        };
    }

    private function getEventColor(string $event): string
    {
        return match (true) {
            str_contains($event, 'approved'), str_contains($event, 'submitted') => 'var(--success)',
            str_contains($event, 'returned') => 'var(--danger)',
            str_contains($event, 'uploaded') => 'var(--info)',
            default => 'var(--warning)',
        };
    }

    private function getAreaColor(int $order): string
    {
        $colors = [
            1 => '#1a7a4a', 2 => '#185FA5', 3 => '#c9a84c',  4 => '#6b3fa0',  5 => '#e07a00',
            6 => '#9b1c1c', 7 => '#185FA5', 8 => '#9b1c1c',  9 => '#1a7a4a', 10 => '#c9a84c',
        ];
        return $colors[$order] ?? '#1a7a4a';
    }
}
