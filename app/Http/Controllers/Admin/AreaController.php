<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAreaRequest;
use App\Http\Requests\Admin\UpdateAreaRequest;
use App\Models\Area;
use App\Models\Document;
use App\Models\Program;
use App\Models\SubArea;
use App\Services\AreaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaController extends Controller
{
    public function __construct(
        protected AreaService $areaService
    ) {}
    public function index(Request $request)
    {
        $user       = $request->user()->load('roles');
        $role       = $user->roles->first()?->slug ?? '';
        $isCoord    = in_array($role, ['area-coordinator', 'program-coordinator']);
        $isDirector = $role === 'director';
        $isDean     = $role === 'dean';
        // All 3 roles (dean + both coord types) can upload/edit/view/download
        $canAct     = $isDean || $isCoord;

        // For coordinators + dean — only their assigned areas
        $assignedAreaIds = ($isCoord || $isDean)
            ? $user->areaAssignments()->pluck('area_id')->toArray()
            : [];

        // Only fetch programs this user is allowed to see
        $visibleProgramIds = null;
        if (in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            $visibleProgramIds = $user->program_id ? [$user->program_id] : [];
        }

        $programs = Program::where('is_active', true)
            ->when($visibleProgramIds !== null, fn ($q) => $q->whereIn('id', $visibleProgramIds))
            ->get();
        // Load all non-archived areas with sub_areas + documents per slot
        $areas = Area::where('is_archived', false)
            ->with([
                'subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'subAreas.documents' => fn ($q) => $q->with('uploader'),
                'subAreas.notes',
                'assignments.user',
            ])
            ->orderBy('order_number')
            ->get();

        // Scope to assigned areas for coordinators
        if ($isCoord) {
            $areas = $areas->filter(fn ($a) => in_array($a->id, $assignedAreaIds))->values();
        }

        // Director visibility: see ALL statuses
        // Dean: see ALL statuses — can act on submitted_to_dean
        // Director: can see ALL but typically focuses on submitted_to_director

        $mappedAreas = $areas->map(function ($area) use ($isDirector, $isCoord, $isDean, $canAct, $user) {
            return [
                'id'           => $area->id,
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'deadline_at'  => $area->deadline_at?->format('Y-m-d'),
                'coordinators' => $area->assignments->map(fn ($a) => [
                    'name'      => $a->user?->name,
                    'role_type' => $a->role_type,
                ])->values(),
                'sub_areas' => $area->subAreas->map(function ($sa) use ($isCoord, $isDean, $canAct, $user) {
                    $docs = $sa->documents->keyBy('doc_type');

                    // Return note for this user's program
                    $programId  = $user->program_id;
                    $returnNote = $programId
                        ? $sa->notes->firstWhere('program_id', $programId)?->notes
                        : null;

                    $slotMap = fn($type) => $docs->has($type) ? [
                        'id'               => $docs[$type]->id,
                        'title'            => $docs[$type]->title,
                        'status'           => $docs[$type]->status,
                        'approval_status'  => $docs[$type]->approval_status ?? 'pending',
                        'rejection_reason' => $docs[$type]->rejection_reason,
                        'version'          => 'v' . $docs[$type]->current_version,
                        'uploader'         => $docs[$type]->uploader?->name,
                        'can_edit'         => $canAct,
                        'can_approve'      => $isDean,
                        'doc_id'           => $docs[$type]->id,
                    ] : null;

                    return [
                        'id'                   => $sa->id,
                        'name'                 => $sa->name,
                        'order_number'         => $sa->order_number,
                        'submission_status'    => $sa->submission_status,
                        'submitted_by_dean_at' => $sa->submitted_by_dean_at?->format('M j, Y'),
                        'return_notes'         => $returnNote,
                        'slots' => [
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
            'programs'          => $programs->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code]),
            'role'              => $role,
            'can_act'           => $canAct,
            'my_program_id'     => $user->program_id ?? null,
            'assigned_area_ids' => $assignedAreaIds,
        ]);
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
            ->with(['subAreas' => fn($q) => $q->where('is_archived', false)->orderBy('order_number')])
            ->orderBy('order_number')
            ->get()
            ->map(fn ($area) => [
                'id'           => $area->id,
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'deadline_at'  => $area->deadline_at?->format('Y-m-d'),
                'is_archived'  => $area->is_archived,
                'sub_areas'    => $area->subAreas->map(fn ($sa) => [
                    'id'                => $sa->id,
                    'name'              => $sa->name,
                    'order_number'      => $sa->order_number,
                    'submission_status' => $sa->submission_status,
                    'is_archived'       => $sa->is_archived,
                ])->values(),
            ]);

        return Inertia::render('Areas/Management', [
            'areas' => $areas,
        ]);
    }

    /**
     * Director: create a new area.
     */
    public function store(StoreAreaRequest $request)
    {
        $this->authorize('create', Area::class);

        $area = $this->areaService->createArea($request->validated(), $request->user());

        return back()->with('success', "Area \"{$area->name}\" created.");
    }

    /**
     * Director: update area.
     */
    public function update(Area $area, UpdateAreaRequest $request)
    {
        $this->authorize('update', $area);

        $this->areaService->updateArea($area, $request->validated());

        return back()->with('success', "Area updated.");
    }

    /**
     * Director: archive area.
     */
    public function archive(Area $area)
    {
        $this->authorize('delete', $area);

        $this->areaService->archiveArea($area);

        return back()->with('success', "\"{$area->name}\" archived.");
    }
}
