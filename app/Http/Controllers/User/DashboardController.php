<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\AccreditationCycle;
use App\Models\AreaSubmission;
use App\Models\Document;
use App\Models\Program;
use App\Models\SubArea;
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
        $readinessTrend = $this->buildReadinessTrend($user, $role?->slug, 365);

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
                'name'        => $area->name,
                'pct'         => $pct,
                'color'       => $this->getAreaColor($area->order_number),
                'deadline_at' => $area->deadline_at?->format('Y-m-d'),
            ];
        });

        // ── Upcoming & overdue deadlines for coordinator dashboard ──
        $upcomingDeadlines = Area::whereNotNull('deadline_at')
            ->where('deadline_at', '>=', now()->subDays(1))
            ->orderBy('deadline_at')
            ->take(5)
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'name'        => $a->name,
                'deadline_at' => $a->deadline_at->format('Y-m-d'),
                'days_left'   => (int) ceil(($a->deadline_at->timestamp - now()->timestamp) / 86400),
            ]);

        $overdueDeadlines = Area::whereNotNull('deadline_at')
            ->where('deadline_at', '<', now())
            ->orderByDesc('deadline_at')
            ->take(5)
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'name'        => $a->name,
                'deadline_at' => $a->deadline_at->format('Y-m-d'),
                'days_left'   => (int) ceil(($a->deadline_at->timestamp - now()->timestamp) / 86400),
            ]);

        $page = match ($role?->slug) {
            'admin'               => 'Dashboard/Admin',
            'director'            => 'Dashboard/Director',
            'dean'                => 'Dashboard/Dean',
            'program-coordinator' => 'Dashboard/Coordinator',
            'area-coordinator'    => 'Dashboard/Coordinator',
            default               => 'Dashboard/Director',
        };

        // ── Pending area submissions for Dean (sub-areas submitted to dean, awaiting action) ──
        $pendingDeanSubmissions = [];
        if ($role?->slug === 'dean' && $user->program_id) {
            $pendingDeanSubmissions = SubArea::where('submission_status', 'submitted_to_dean')
                ->with('area')
                ->get()
                ->map(fn ($sa) => [
                    'id'          => $sa->id,
                    'name'        => $sa->name,
                    'area_name'   => $sa->area?->name,
                    'submitted_at'=> $sa->submitted_by_dean_at?->format('M j, Y') ?? '—',
                ])->values()->toArray();
        }

        // ── Pending area reviews for Director (sub-areas forwarded to director) ──
        $pendingDirectorReviews = [];
        if ($role?->slug === 'director') {
            $pendingDirectorReviews = SubArea::whereIn('submission_status', ['submitted_to_director', 'submitted'])
                ->with('area')
                ->get()
                ->map(fn ($sa) => [
                    'id'        => $sa->id,
                    'name'      => $sa->name,
                    'area_name' => $sa->area?->name,
                    'status'    => $sa->submission_status,
                ])->values()->toArray();
        }

        return Inertia::render($page, [
            'stats'                   => $stats,
            'programs'                => $programs,
            'readinessTrend'          => $readinessTrend,
            'recentDocs'              => $recentDocs,
            'activities'              => $activities,
            'areaItems'               => $areaItems,
            'upcomingDeadlines'       => $upcomingDeadlines,
            'overdueDeadlines'        => $overdueDeadlines,
            'currentRole'             => $role?->slug ?? 'director',
            'userCount'               => User::count(),
            'logCount'                => ActivityLog::count(),
            'pendingDeanSubmissions'  => $pendingDeanSubmissions,
            'pendingDirectorReviews'  => $pendingDirectorReviews,
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

    private function buildReadinessTrend($user, ?string $roleSlug, int $days = 365): array
    {
        $days = max(30, $days);
        $start = now()->subDays($days - 1)->startOfDay();

        $query = Document::query()->select([
            'program_id',
            'sub_area_id',
            'status',
            'approval_status',
            'created_at',
            'updated_at',
            'approved_at',
        ]);

        // Scope trend data to the current role visibility.
        if (in_array($roleSlug, ['dean', 'program-coordinator'], true) && $user->program_id) {
            $query->where('program_id', $user->program_id);
        } elseif ($roleSlug === 'area-coordinator') {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id');
            $query->whereHas('subArea', fn ($q) => $q->whereIn('area_id', $assignedAreaIds));
        }

        $documents = $query->get();

        $totalDailyAdds = array_fill(0, $days, 0);
        $approvedDailyAdds = array_fill(0, $days, 0);
        $baseTotal = 0;
        $baseApproved = 0;

        foreach ($documents as $document) {
            $createdAt = $document->created_at instanceof Carbon
                ? $document->created_at
                : Carbon::parse($document->created_at);

            if ($createdAt->lt($start)) {
                $baseTotal++;
            } else {
                $createdIndex = min($days - 1, $start->diffInDays($createdAt->copy()->startOfDay()));
                $totalDailyAdds[$createdIndex]++;
            }

            $approvedMoment = null;
            if ($document->approved_at) {
                $approvedMoment = $document->approved_at instanceof Carbon
                    ? $document->approved_at
                    : Carbon::parse($document->approved_at);
            } elseif (
                in_array($document->status, ['approved'], true)
                || in_array($document->approval_status, ['approved'], true)
            ) {
                // Fallback for legacy rows with no approved_at.
                $approvedMoment = $document->updated_at instanceof Carbon
                    ? $document->updated_at
                    : Carbon::parse($document->updated_at);
            }

            if (!$approvedMoment) {
                continue;
            }

            if ($approvedMoment->lt($start)) {
                $baseApproved++;
            } else {
                $approvedIndex = min($days - 1, $start->diffInDays($approvedMoment->copy()->startOfDay()));
                $approvedDailyAdds[$approvedIndex]++;
            }
        }

        $trend = [];
        $runningTotal = $baseTotal;
        $runningApproved = $baseApproved;

        for ($i = 0; $i < $days; $i++) {
            $runningTotal += $totalDailyAdds[$i];
            $runningApproved += $approvedDailyAdds[$i];

            $date = $start->copy()->addDays($i);
            $value = $runningTotal > 0 ? round(($runningApproved / $runningTotal) * 100, 1) : 0.0;

            $trend[] = [
                'date' => $date->toDateString(),
                'label' => $date->format('M j'),
                'value' => $value,
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
