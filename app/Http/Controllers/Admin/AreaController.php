<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaItem;
use App\Models\AreaNote;
use App\Models\Program;
use App\Models\RevisionReturn;
use App\Models\SubArea;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaController extends Controller
{
    public function index(Request $request)
    {
        $user       = $request->user()->load('roles');
        $role       = $user->roles->first()?->slug ?? '';
        $isCoord    = in_array($role, ['area-coordinator', 'program-coordinator']);
        $isDirector = $role === 'director';
        $isDean     = $role === 'dean';
        $canAct     = $isDean || $isCoord || $isDirector; // ALL roles can edit/upload now

        $assignedAreaIds = ($isCoord || $isDean)
            ? $user->areaAssignments()->pluck('area_id')->toArray()
            : [];

        // Program visibility:
        //  - Director: ALL active programs
        //  - Dean / Coordinator: only their own program
        $visibleProgramIds = null;
        if (in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            $visibleProgramIds = $user->program_id ? [$user->program_id] : [];
        }

        $programs = Program::where('is_active', true)
            ->when($visibleProgramIds !== null, fn($q) => $q->whereIn('id', $visibleProgramIds))
            ->orderBy('name')
            ->get();

        $activeCycle    = AccreditationCycle::active();
        $viewingCycleId = $request->session()->get('viewing_cycle_id', $activeCycle?->id);

        $areas = Area::where('is_archived', false)
            ->with([
                'subAreas' => fn($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'subAreas.documents' => fn($q) => $q
                    ->with('uploader')
                    ->when($viewingCycleId, fn($q2) => $q2->where('cycle_id', $viewingCycleId)),
                'subAreas.items' => fn($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'assignments.user',
                'checklists',
            ])
            ->orderBy('order_number')
            ->get();

        // Coordinators see only their assigned areas
        if ($isCoord) {
            $areas = $areas->filter(fn($a) => in_array($a->id, $assignedAreaIds))->values();
        }

        // ── Active returns lookup ────────────────────────────────────
        $returnsByProgramAndKey = $this->loadActiveReturns(
            $areas->pluck('subAreas')->flatten()->pluck('id')->all(),
            $visibleProgramIds ?? $programs->pluck('id')->all(),
        );

        // ── Area notes (Dean comments + replies) ─────────────────────
        // Dean/coordinators see notes for their own program only.
        // Director sees notes for all visible programs.
        $notesScopeProgramIds = $visibleProgramIds ?? $programs->pluck('id')->all();
        $myProgramId = $user->program_id;
        $notesByArea = AreaNote::whereIn('area_id', $areas->pluck('id'))
            ->when(!empty($notesScopeProgramIds), fn($q) => $q->whereIn('program_id', $notesScopeProgramIds))
            ->with(['user.roles', 'replies.user.roles'])
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('area_id');

        $mappedAreas = $areas->map(function ($area) use ($returnsByProgramAndKey, $isDirector, $notesByArea) {
            $areaNotes = ($notesByArea->get($area->id) ?? collect())->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'program_id' => $n->program_id,
                'user_name'  => $n->user?->name ?? 'Unknown',
                'user_role'  => $this->formatRoleLabel($n->user?->roles?->first()?->slug),
                'content'    => $n->content,
                'created_at' => $n->created_at->format('M j, Y H:i'),
                'replies'    => $n->replies->map(fn($r) => [
                    'id'         => $r->id,
                    'user_name'  => $r->user?->name ?? 'Unknown',
                    'user_role'  => $this->formatRoleLabel($r->user?->roles?->first()?->slug),
                    'message'    => $r->message,
                    'created_at' => $r->created_at->format('M j, Y H:i'),
                ])->values(),
            ])->values();

            return [
                'id'           => $area->id,
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'deadline_at'  => $area->deadline_at?->format('Y-m-d'),
                'notes'        => $areaNotes,
                'coordinators' => $area->assignments->map(fn($a) => [
                    'name'      => $a->user?->name,
                    'role_type' => $a->role_type,
                ])->values(),
                'checklist'    => $area->checklists->map(fn($c) => [
                    'id'            => $c->id,
                    'evidence_type' => $c->evidence_type,
                    'description'   => $c->description,
                    'is_required'   => $c->is_required,
                    'is_completed'  => $c->is_completed,
                    'order_number'  => $c->order_number,
                ])->values(),
                'sub_areas'    => $area->subAreas->map(function (SubArea $sa) use ($returnsByProgramAndKey) {
                    $docs = $sa->documents->keyBy('doc_type');

                    // Build per-program return summary so the UI can paint red badges per program tab
                    $perProgramReturns = [];
                    foreach ($returnsByProgramAndKey as $programId => $byKey) {
                        $saKey   = "sub_area:{$sa->id}";
                        $itemIds = $sa->items->pluck('id')->all();
                        $itemReturns = [];
                        foreach ($itemIds as $iid) {
                            $key = "item:{$iid}";
                            if (isset($byKey[$key])) $itemReturns[$iid] = $byKey[$key];
                        }
                        $saReturn = $byKey[$saKey] ?? null;
                        if ($saReturn || !empty($itemReturns)) {
                            $perProgramReturns[$programId] = [
                                'sub_area_return' => $saReturn,
                                'item_returns'    => $itemReturns,
                            ];
                        }
                    }

                    $slotMap = fn($type) => $docs->has($type) ? [
                        'id'       => $docs[$type]->id,
                        'title'    => $docs[$type]->title,
                        'status'   => $docs[$type]->status,
                        'version'  => 'v' . $docs[$type]->current_version,
                        'uploader' => $docs[$type]->uploader?->name,
                        'doc_id'   => $docs[$type]->id,
                    ] : null;

                    return [
                        'id'           => $sa->id,
                        'name'         => $sa->name,
                        'order_number' => $sa->order_number,
                        'returns'      => $perProgramReturns,
                        'items'        => $sa->items->map(fn(AreaItem $i) => [
                            'id'             => $i->id,
                            'label'          => $i->label,
                            'ipo_type'       => $i->ipo_type,
                            'order_number'   => $i->order_number,
                            'parent_item_id' => $i->parent_item_id,
                        ])->values(),
                        'slots'        => [
                            'input'   => $slotMap('input'),
                            'process' => $slotMap('process'),
                            'outcome' => $slotMap('outcome'),
                        ],
                    ];
                })->values(),
            ];
        });

        return Inertia::render('Areas/Index', [
            'areas'             => $mappedAreas,
            'programs'          => $programs->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code]),
            'role'              => $role,
            'can_act'           => $canAct,
            'my_program_id'     => $user->program_id ?? null,
            'assigned_area_ids' => $assignedAreaIds,
            'cycle_locked'      => !$activeCycle || $activeCycle->end_date->isPast(),
            'is_viewing_past'   => $viewingCycleId && $viewingCycleId !== ($activeCycle?->id),
        ]);
    }

    /**
     * Load active RevisionReturns for the given sub-areas (and items inside them),
     * grouped by program_id then by morph-key ("sub_area:{id}" or "item:{id}").
     */
    private function loadActiveReturns(array $subAreaIds, array $programIds): array
    {
        if (empty($subAreaIds) || empty($programIds)) return [];

        $itemIds = AreaItem::whereIn('sub_area_id', $subAreaIds)
            ->where('is_archived', false)
            ->pluck('id')
            ->all();

        $rows = RevisionReturn::active()
            ->whereIn('program_id', $programIds)
            ->where(function ($q) use ($subAreaIds, $itemIds) {
                $q->where(function ($q2) use ($subAreaIds) {
                    $q2->where('returnable_type', (new SubArea)->getMorphClass())
                       ->whereIn('returnable_id', $subAreaIds);
                });
                if (!empty($itemIds)) {
                    $q->orWhere(function ($q2) use ($itemIds) {
                        $q2->where('returnable_type', (new AreaItem)->getMorphClass())
                           ->whereIn('returnable_id', $itemIds);
                    });
                }
            })
            ->with('returner:id,name')
            ->get();

        $grouped = [];
        foreach ($rows as $r) {
            $type = $r->returnable_type === (new SubArea)->getMorphClass() ? 'sub_area' : 'item';
            $key  = "{$type}:{$r->returnable_id}";
            $grouped[$r->program_id][$key] = [
                'id'              => $r->id,
                'comment'         => $r->comment,
                'returned_by'     => $r->returner?->name,
                'returned_by_role'=> $r->returned_by_role,
                'returned_at'     => $r->created_at->format('M j, Y g:i A'),
            ];
        }
        return $grouped;
    }

    /**
     * Director-only: Area & Sub-area structure management page.
     */
    public function management(Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'director') {
            abort(403, 'Only the QUAMC Director can manage the area structure.');
        }

        $areas = Area::where('is_archived', false)
            ->with([
                'subAreas' => fn($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'checklists',
            ])
            ->withCount(['subAreas as sub_areas_count' => fn($q) => $q->where('is_archived', false)])
            ->orderBy('order_number')
            ->get()
            ->map(fn($area) => [
                'id'              => $area->id,
                'name'            => $area->name,
                'order_number'    => $area->order_number,
                'deadline_at'     => $area->deadline_at?->format('Y-m-d'),
                'is_archived'     => $area->is_archived,
                'sub_areas_count' => $area->sub_areas_count,
                'checklist'       => $area->checklists->map(fn($c) => [
                    'id'            => $c->id,
                    'evidence_type' => $c->evidence_type,
                    'description'   => $c->description,
                    'is_required'   => $c->is_required,
                    'is_completed'  => $c->is_completed,
                    'order_number'  => $c->order_number,
                ])->values(),
                'sub_areas'       => $area->subAreas->map(fn($sa) => [
                    'id'           => $sa->id,
                    'name'         => $sa->name,
                    'order_number' => $sa->order_number,
                    'is_archived'  => $sa->is_archived,
                    'item_count'   => AreaItem::where('sub_area_id', $sa->id)
                        ->whereNull('parent_item_id')
                        ->where('is_archived', false)
                        ->count(),
                ])->values(),
            ]);

        return Inertia::render('Areas/Management', ['areas' => $areas]);
    }

    /**
     * Director: create a new area (optionally with bulk sub-areas).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
            'sub_areas'    => 'nullable|array',
            'sub_areas.*'  => 'string|max:200',
        ]);

        $area = Area::create([
            'name'         => $data['name'],
            'order_number' => $data['order_number'] ?? 0,
            'created_by'   => $request->user()->id,
        ]);

        foreach ($data['sub_areas'] ?? [] as $idx => $subName) {
            if (trim($subName) !== '') {
                SubArea::create([
                    'area_id'      => $area->id,
                    'name'         => trim($subName),
                    'order_number' => $idx + 1,
                    'created_by'   => $request->user()->id,
                ]);
            }
        }

        return back()->with('success', "Area \"{$data['name']}\" created.");
    }

    public function update(Area $area, Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
            'deadline_at'  => 'nullable|date',
        ]);

        $area->update($data);

        return back()->with('success', "Area updated.");
    }

    public function archive(Area $area)
    {
        $area->update(['is_archived' => true]);
        return back()->with('success', "\"{$area->name}\" archived.");
    }

    public function setDeadline(Area $area, Request $request)
    {
        $request->validate(['deadline_at' => 'nullable|date']);

        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['dean', 'director'])) {
            return back()->with('error', 'Only Dean or Director can set area deadlines.');
        }

        $area->update(['deadline_at' => $request->deadline_at ?: null]);

        $msg = $request->deadline_at
            ? "Deadline set to " . \Carbon\Carbon::parse($request->deadline_at)->format('M j, Y') . " for \"{$area->name}\"."
            : "Deadline cleared for \"{$area->name}\".";

        return back()->with('success', $msg);
    }

    private function formatRoleLabel(?string $slug): string
    {
        return match ($slug) {
            'dean'                => 'Dean',
            'director'            => 'Director',
            'area-coordinator'    => 'Area Coordinator',
            'program-coordinator' => 'Program Coordinator',
            'admin'               => 'Admin',
            default               => ucwords(str_replace('-', ' ', $slug ?? 'User')),
        };
    }
}
