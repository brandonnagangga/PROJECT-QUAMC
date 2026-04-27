<?php

namespace App\Http\Controllers;

use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaChecklist;
use App\Models\Document;
use App\Models\Program;
use App\Models\SubArea;
use App\Models\SubAreaNote;
use App\Models\SubAreaNoteReply;
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
        // Determine which cycle to show documents from (session-based)
        $activeCycle  = AccreditationCycle::active();
        $viewingCycleId = $request->session()->get('viewing_cycle_id', $activeCycle?->id);

        // Load all non-archived areas with sub_areas + documents per slot
        $areas = Area::where('is_archived', false)
            ->with([
                'subAreas'          => fn ($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'subAreas.documents' => fn ($q) => $q
                    ->with('uploader')
                    ->when($viewingCycleId, fn ($q2) => $q2->where('cycle_id', $viewingCycleId)),
                'subAreas.notes',
                'assignments.user',
                'checklists',   // evidence requirement checklist
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
                'checklist' => $area->checklists->map(fn ($c) => [
                    'id'            => $c->id,
                    'evidence_type' => $c->evidence_type,
                    'description'   => $c->description,
                    'is_required'   => $c->is_required,
                    'is_completed'  => $c->is_completed,
                    'order_number'  => $c->order_number,
                ])->values(),
                'sub_areas' => $area->subAreas->map(function ($sa) use ($isCoord, $isDean, $canAct, $user) {
                    $docs = $sa->documents->keyBy('doc_type');

                    // Return note for this user's program
                    $programId  = $user->program_id;
                    $returnNote = $programId
                        ? $sa->notes->firstWhere('program_id', $programId)?->notes
                        : null;

                    // Note replies for this sub-area + program
                    $noteReplies = $programId
                        ? SubAreaNoteReply::where('sub_area_id', $sa->id)
                            ->where('program_id', $programId)
                            ->with('user')
                            ->orderBy('created_at')
                            ->get()
                            ->map(fn ($r) => [
                                'id'         => $r->id,
                                'message'    => $r->message,
                                'user_name'  => $r->user?->name ?? 'Unknown',
                                'created_at' => $r->created_at->format('M j, Y H:i'),
                            ])->values()
                        : collect();

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
                        'note_replies'         => $noteReplies,
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
            // Locked = no active cycle OR active cycle's end_date has passed
            'cycle_locked'      => !$activeCycle || $activeCycle->end_date->isPast(),
            'is_viewing_past'   => $viewingCycleId && $viewingCycleId !== ($activeCycle?->id),
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
            ->with([
                'subAreas'  => fn($q) => $q->where('is_archived', false)->orderBy('order_number'),
                'checklists',
            ])
            ->orderBy('order_number')
            ->get()
            ->map(fn ($area) => [
                'id'           => $area->id,
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'deadline_at'  => $area->deadline_at?->format('Y-m-d'),
                'is_archived'  => $area->is_archived,
                'checklist'    => $area->checklists->map(fn ($c) => [
                    'id'            => $c->id,
                    'evidence_type' => $c->evidence_type,
                    'description'   => $c->description,
                    'is_required'   => $c->is_required,
                    'is_completed'  => $c->is_completed,
                    'order_number'  => $c->order_number,
                ])->values(),
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

        // Bulk-create optional sub-areas
        foreach ($data['sub_areas'] ?? [] as $idx => $subName) {
            if (trim($subName) !== '') {
                SubArea::create([
                    'area_id'           => $area->id,
                    'name'              => trim($subName),
                    'order_number'      => $idx + 1,
                    'submission_status' => 'draft',
                    'created_by'        => $request->user()->id,
                ]);
            }
        }

        return back()->with('success', "Area \"{$data['name']}\" created.");
    }

    /**
     * Director: update area.
     */
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

    /**
     * Director: archive area.
     */
    public function archive(Area $area)
    {
        $area->update(['is_archived' => true]);

        return back()->with('success', "\"{$area->name}\" archived.");
    }

    /**
     * Dean or Director: set or clear the deadline for an area.
     */
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
}

