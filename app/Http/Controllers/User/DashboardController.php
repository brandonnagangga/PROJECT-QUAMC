<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\AccreditationCycle;
use App\Models\Document;
use App\Models\Program;
use App\Models\RevisionReturn;
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
        $user           = $request->user()->load('roles');
        $role           = $user->roles->first();
        $activeCycle    = AccreditationCycle::active();
        $viewingCycleId = $request->session()->get('viewing_cycle_id', $activeCycle?->id);

        $stats          = $this->getStatsForRole($user, $role?->slug, $viewingCycleId);
        $readinessTrend = $this->buildReadinessTrend($user, $role?->slug, 365);

        // ── Programs with area completion (based on doc slots: 3 per sub-area) ──
        $programs = Program::where('is_active', true)->get()
            ->map(function ($program) {
                $areas = Area::orderBy('order_number')->get()->map(function ($area) use ($program) {
                    $subAreaIds = $area->subAreas()->pluck('id');
                    $totalSlots    = $subAreaIds->count() * 3;
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

        $recentDocsQuery = Document::with(['subArea.area', 'program', 'uploader'])
            ->when($viewingCycleId, fn($q) => $q->where('cycle_id', $viewingCycleId));

        if (in_array($role?->slug, ['dean', 'program-coordinator', 'area-coordinator'], true) && $user->program_id) {
            $recentDocsQuery->where('program_id', $user->program_id);
        }

        if (in_array($role?->slug, ['area-coordinator', 'program-coordinator'], true)) {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->unique()->values();
            $recentDocsQuery->whereHas('subArea', fn($q) => $q->whereIn('area_id', $assignedAreaIds));
        }

        $recentDocs = $recentDocsQuery
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

        // ── Area progress summary ──
        $areaItemsQuery = Area::where('is_archived', false)->orderBy('order_number');
        if (in_array($role?->slug, ['area-coordinator', 'program-coordinator'], true)) {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->unique()->values();
            $areaItemsQuery->whereIn('id', $assignedAreaIds);
        }

        $areaItems = $areaItemsQuery->get()->map(function ($area) use ($user, $role, $viewingCycleId) {
            $subAreaIds    = $area->subAreas()->pluck('id');
            $totalSlots    = $subAreaIds->count() * 3;
            $approvedSlots = 0;

            if ($totalSlots > 0) {
                $approvedQuery = Document::whereIn('sub_area_id', $subAreaIds)
                    ->when($viewingCycleId, fn($q) => $q->where('cycle_id', $viewingCycleId))
                    ->where('status', 'approved');

                if (in_array($role?->slug, ['dean', 'program-coordinator', 'area-coordinator'], true) && $user->program_id) {
                    $approvedQuery->where('program_id', $user->program_id);
                }

                $approvedSlots = $approvedQuery->count();
            }
            $pct = $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0;
            return [
                'name'        => $area->name,
                'pct'         => $pct,
                'color'       => $this->getAreaColor($area->order_number),
                'deadline_at' => $area->deadline_at?->format('Y-m-d'),
            ];
        });

        // ── Deadlines ──
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

        // ── Open returns (replaces the old pending-submission lists) ──
        $openReturns = $this->buildOpenReturns($user, $role?->slug);

        $page = match ($role?->slug) {
            'admin'               => 'Dashboard/Admin',
            'director'            => 'Dashboard/Director',
            'dean'                => 'Dashboard/Dean',
            'program-coordinator' => 'Dashboard/Coordinator',
            'area-coordinator'    => 'Dashboard/Coordinator',
            default               => 'Dashboard/Director',
        };

        return Inertia::render($page, [
            'stats'             => $stats,
            'programs'          => $programs,
            'readinessTrend'    => $readinessTrend,
            'recentDocs'        => $recentDocs,
            'activities'        => $activities,
            'areaItems'         => $areaItems,
            'upcomingDeadlines' => $upcomingDeadlines,
            'overdueDeadlines'  => $overdueDeadlines,
            'currentRole'       => $role?->slug ?? 'director',
            'userCount'         => User::count(),
            'logCount'          => ActivityLog::count(),
            'openReturns'       => $openReturns,
        ]);
    }

    /**
     * Open (unresolved) returns visible to the current role.
     *  - Director: all open returns across all programs
     *  - Dean: open returns within their own program
     *  - Coordinators: open returns affecting their assigned areas + program
     */
    private function buildOpenReturns($user, ?string $roleSlug): array
    {
        $q = RevisionReturn::active()
            ->with(['program:id,name,code', 'subArea:id,name,area_id', 'subArea.area:id,name', 'returner:id,name']);

        if (in_array($roleSlug, ['dean', 'program-coordinator', 'area-coordinator'], true) && $user->program_id) {
            $q->where('program_id', $user->program_id);
        }

        if (in_array($roleSlug, ['area-coordinator', 'program-coordinator'], true)) {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->unique()->values();
            $q->whereHas('subArea', fn($s) => $s->whereIn('area_id', $assignedAreaIds));
        }

        return $q->orderByDesc('created_at')->take(10)->get()
            ->map(fn (RevisionReturn $r) => [
                'id'               => $r->id,
                'target_type'      => str_ends_with($r->returnable_type, 'AreaItem') ? 'item' : 'sub_area',
                'sub_area_name'    => $r->subArea?->name,
                'area_name'        => $r->subArea?->area?->name,
                'program_name'     => $r->program?->name,
                'program_code'     => $r->program?->code,
                'returned_by'      => $r->returner?->name,
                'returned_by_role' => $r->returned_by_role,
                'comment'          => $r->comment,
                'returned_at'      => $r->created_at->diffForHumans(),
            ])->toArray();
    }

    private function getStatsForRole($user, ?string $roleSlug, ?int $cycleId = null): array
    {
        $documentQuery = Document::query()
            ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId));

        $assignedAreaIds = collect();
        if (in_array($roleSlug, ['area-coordinator', 'program-coordinator'], true)) {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->unique()->values();
            $documentQuery->whereHas('subArea', fn($q) => $q->whereIn('area_id', $assignedAreaIds));
        }

        if (in_array($roleSlug, ['dean', 'program-coordinator', 'area-coordinator'], true) && $user->program_id) {
            $documentQuery->where('program_id', $user->program_id);
        }

        $totalDocs = (clone $documentQuery)->count();
        $approved  = (clone $documentQuery)->where('status', 'approved')->count();
        $pending   = (clone $documentQuery)->where('status', 'pending_review')->count();

        // Open returns within the same scope (used for the "Open Returns" stat card)
        $returnsQuery = RevisionReturn::active();
        if (in_array($roleSlug, ['dean', 'program-coordinator', 'area-coordinator'], true) && $user->program_id) {
            $returnsQuery->where('program_id', $user->program_id);
        }
        if (in_array($roleSlug, ['area-coordinator', 'program-coordinator'], true)) {
            $returnsQuery->whereHas('subArea', fn($q) => $q->whereIn('area_id', $assignedAreaIds));
        }
        $openReturnsCount = (clone $returnsQuery)->count();

        $programs = Program::where('is_active', true)->count();
        if ($roleSlug === 'program-coordinator') {
            $programs = Area::where('is_archived', false)->whereIn('id', $assignedAreaIds)->count();
        } elseif ($roleSlug === 'area-coordinator') {
            $programs = (string) $totalDocs;
        }

        $readiness = $totalDocs > 0 ? round(($approved / $totalDocs) * 100) : 0;

        return [
            'programs'      => (string) $programs,
            'readiness'     => $readiness . '%',
            'readinessSub'  => in_array($roleSlug, ['area-coordinator', 'program-coordinator'], true) ? 'Current scope' : 'Across all programs',
            'approved'      => (string) $approved,
            'approvedSub'   => 'Of ' . $totalDocs . ' total',
            'pending'       => (string) $pending,
            'pendingSub'    => 'Awaiting action',
            'openReturns'   => (string) $openReturnsCount,
            'openReturnsSub'=> $openReturnsCount === 1 ? '1 needs revision' : 'need revision',
        ];
    }

    private function buildReadinessTrend($user, ?string $roleSlug, int $days = 365): array
    {
        $days  = max(30, $days);
        $start = now()->subDays($days - 1)->startOfDay();

        $query = Document::query()->select([
            'program_id',
            'sub_area_id',
            'status',
            'created_at',
            'updated_at',
        ]);

        if (in_array($roleSlug, ['dean', 'program-coordinator'], true) && $user->program_id) {
            $query->where('program_id', $user->program_id);
        } elseif ($roleSlug === 'area-coordinator') {
            $assignedAreaIds = $user->areaAssignments()->pluck('area_id');
            $query->whereHas('subArea', fn ($q) => $q->whereIn('area_id', $assignedAreaIds));
        }

        $documents = $query->get();

        $totalDailyAdds    = array_fill(0, $days, 0);
        $approvedDailyAdds = array_fill(0, $days, 0);
        $baseTotal    = 0;
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
            if ($document->status === 'approved') {
                $approvedMoment = $document->updated_at instanceof Carbon
                    ? $document->updated_at
                    : Carbon::parse($document->updated_at);
            }
            if (!$approvedMoment) continue;

            if ($approvedMoment->lt($start)) {
                $baseApproved++;
            } else {
                $approvedIndex = min($days - 1, $start->diffInDays($approvedMoment->copy()->startOfDay()));
                $approvedDailyAdds[$approvedIndex]++;
            }
        }

        $trend = [];
        $runningTotal    = $baseTotal;
        $runningApproved = $baseApproved;

        for ($i = 0; $i < $days; $i++) {
            $runningTotal    += $totalDailyAdds[$i];
            $runningApproved += $approvedDailyAdds[$i];
            $date  = $start->copy()->addDays($i);
            $value = $runningTotal > 0 ? round(($runningApproved / $runningTotal) * 100, 1) : 0.0;

            $trend[] = [
                'date'  => $date->toDateString(),
                'label' => $date->format('M j'),
                'value' => $value,
            ];
        }

        return $trend;
    }

    private function getEventIcon(string $event): string
    {
        return match (true) {
            str_contains($event, 'returned')  => '↩',
            str_contains($event, 'resolved')  => '✓',
            str_contains($event, 'uploaded')  => '↑',
            default => '•',
        };
    }

    private function getEventBg(string $event): string
    {
        return match (true) {
            str_contains($event, 'resolved') => 'var(--success-light)',
            str_contains($event, 'returned') => 'var(--danger-light)',
            str_contains($event, 'uploaded') => 'var(--info-light)',
            default => 'var(--gold-pale)',
        };
    }

    private function getEventColor(string $event): string
    {
        return match (true) {
            str_contains($event, 'resolved') => 'var(--success)',
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
