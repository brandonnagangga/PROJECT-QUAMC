<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ApproveDocumentRequest;
use App\Http\Requests\User\RejectDocumentRequest;
use App\Http\Requests\User\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Area;
use App\Models\Document;
use App\Models\EvaluationFinding;
use App\Models\Program;
use App\Models\Standard;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentService $documentService
    ) {}

    /**
     * File-manager style browse page — shows programs → areas → sub_areas → documents.
     * Scoped by role:
     *   dean                     → all programs assigned to their program(s)
     *   program-area-coordinator → only their program + assigned areas
     *   area-coordinator         → only their assigned areas
     *   others                   → everything (director/admin)
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        $isDean        = $role === 'dean';
        $isProgCoord   = $role === 'program-coordinator';
        $isAreaCoord   = $role === 'area-coordinator';
        $isCoordAny    = $isProgCoord || $isAreaCoord;
        $canAct        = $isDean || $isProgCoord || $isAreaCoord;

        // Determine which area IDs this user may see
        $assignedAreaIds = ($isCoordAny || $isDean)
            ? $user->areaAssignments()->pluck('area_id')->toArray()
            : [];

        // All programs are visible to everyone
        $programs = Program::where('is_active', true)
            ->get()
            ->map(function ($program) use ($user, $role, $canAct, $isDean, $assignedAreaIds, $isAreaCoord) {
                // All areas are visible to everyone
                $areasQuery = Area::where('is_archived', false)
                    ->orderBy('order_number')
                    ->with(['subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number')]);

                $areas = $areasQuery->get()->map(function ($area) use ($program, $user, $role, $canAct, $isDean, $assignedAreaIds, $isAreaCoord) {
                    // Check if current user can edit THIS specific program + area combo
                    $canEditThisSlot = false;
                    if ($canAct && $user->program_id === $program->id) {
                        if ($isAreaCoord) {
                            $canEditThisSlot = in_array($area->id, $assignedAreaIds);
                        } else {
                            $canEditThisSlot = true; // Dean and Prog Coord can edit all areas in their program
                        }
                    }
                    
                    $canApproveThisSlot = $isDean && $user->program_id === $program->id;

                    return [
                        'id'   => $area->id,
                        'name' => $area->name,
                        'sub_areas' => $area->subAreas->map(function ($sa) use ($program, $user, $role, $canEditThisSlot, $canApproveThisSlot) {
                            $docs = Document::where('sub_area_id', $sa->id)
                                ->where('program_id', $program->id)
                                ->with(['uploader', 'versions'])
                                ->get()
                                ->keyBy('doc_type');

                            $slot = fn ($type) => $docs->has($type) ? [
                                'id'              => $docs[$type]->id,
                                'title'           => $docs[$type]->title,
                                'status'          => $docs[$type]->status === 'pending_review' ? 'pending' : ($docs[$type]->status ?? 'draft'),
                                'approval_status' => $docs[$type]->approval_status ?? 'pending',
                                'rejection_reason'=> $docs[$type]->rejection_reason,
                                'version'         => 'v' . $docs[$type]->current_version,
                                'uploader'        => $docs[$type]->uploader?->name,
                                'can_edit'        => $canEditThisSlot,
                                'can_download'    => true,
                                'can_approve'     => $canApproveThisSlot,
                                'doc_id'          => $docs[$type]->id,
                                'versions'        => $docs[$type]->versions
                                    ->sortByDesc('version_number')
                                    ->map(fn ($v) => [
                                        'version_number'    => $v->version_number,
                                        'original_filename' => $v->original_filename,
                                        'file_size_bytes'   => $v->file_size_bytes,
                                        'uploaded_at'       => $v->created_at->format('M j, Y'),
                                        'notes'             => $v->notes,
                                    ])->values()->toArray(),
                            ] : null;

                            return [
                                'id'                => $sa->id,
                                'name'              => $sa->name,
                                'submission_status' => $sa->submission_status,
                                'slots' => [
                                    'input'   => $slot('input'),
                                    'process' => $slot('process'),
                                    'outcome' => $slot('outcome'),
                                ],
                            ];
                        })->values(),
                    ];
                });

                return [
                    'id'   => $program->id,
                    'name' => $program->name,
                    'code' => $program->code,
                    'areas' => $areas,
                ];
            });

        // ── Flat document list for the "list" view tab ──
        $filters  = $request->only(['search', 'status', 'view']);
        $docsQuery = Document::with(['subArea.area', 'program', 'uploader'])
            ->orderByDesc('updated_at');

        if (!empty($filters['search'])) {
            $docsQuery->where('title', 'like', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $statusMap = ['pending' => 'pending_review'];
            $mapped = $statusMap[$filters['status']] ?? $filters['status'];
            $docsQuery->where('status', $mapped);
        }

        $documents = $docsQuery->take(100)->get()->map(fn ($d) => [
            'id'       => $d->id,
            'title'    => $d->title,
            'path'     => trim(($d->subArea?->area?->name ?? '') . ' › ' . ($d->subArea?->name ?? '') . ' › ' . ucfirst($d->doc_type ?? ''), ' › '),
            'prog'     => $d->program?->code ?? '',
            'ver'      => 'v' . ($d->current_version ?? 1),
            'status'   => $d->status === 'pending_review' ? 'pending' : ($d->status ?? 'draft'),
            'date'     => $d->updated_at->format('M j'),
            'uploader' => $d->uploader?->name ?? '',
        ]);

        return Inertia::render('Documents/Index', [
            'documents' => $documents,
            'programs'  => $programs,
            'filters'   => $filters,
            'role'      => $role,
            'can_act'   => $canAct,
        ]);
    }

    /**
     * Dedicated Upload Evidence page — returns role-scoped data for Upload.tsx.
     */
    public function uploadPage(Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        $isAreaCoord   = $role === 'area-coordinator';
        $isProgCoord   = $role === 'program-coordinator';
        $isDean        = $role === 'dean';

        // Only uploaders may access this page
        if (!in_array($role, ['dean', 'program-coordinator', 'area-coordinator'])) {
            abort(403, 'Only coordinators and deans may upload evidence.');
        }

        $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->toArray();

        $areasQuery = Area::where('is_archived', false)
            ->with(['subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number')])
            ->orderBy('order_number');

        if ($isAreaCoord) {
            $areasQuery->whereIn('id', $assignedAreaIds);
        }

        $areas = $areasQuery->get()->map(fn ($area) => [
            'id'        => $area->id,
            'name'      => $area->name,
            'sub_areas' => $area->subAreas->map(fn ($sa) => [
                'id'   => $sa->id,
                'name' => $sa->name,
            ])->values(),
        ]);

        $programs = Program::where('is_active', true)
            ->when($user->program_id, fn ($q) => $q->where('id', $user->program_id))
            ->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code]);

        $areaItems = Area::orderBy('order_number')->get()->map(function ($area) {
            $subAreaIds    = $area->subAreas()->pluck('id');
            $totalSlots    = $subAreaIds->count() * 3;
            $approvedSlots = $totalSlots > 0
                ? Document::whereIn('sub_area_id', $subAreaIds)->where('status', 'approved')->count()
                : 0;
            $pct    = $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0;
            $colors = [1=>'#1a7a4a',2=>'#185FA5',3=>'#c9a84c',4=>'#6b3fa0',5=>'#e07a00',
                       6=>'#9b1c1c',7=>'#185FA5',8=>'#9b1c1c',9=>'#1a7a4a',10=>'#c9a84c'];
            return ['name' => $area->name, 'pct' => $pct, 'color' => $colors[$area->order_number] ?? '#1a7a4a'];
        });

        return Inertia::render('Documents/Upload', [
            'programs'          => $programs,
            'areas'             => $areas,
            'my_program_id'     => $user->program_id,
            'assigned_area_ids' => $assignedAreaIds,
            'role'              => $role,
            'areaItems'         => $areaItems,
        ]);
    }

    /**
     * Data endpoint for the upload modal — returns role-scoped areas + sub_areas.
     */
    public function uploadModalData(Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        $isDean      = $role === 'dean';
        $isProgCoord = $role === 'program-coordinator';
        $isAreaCoord = $role === 'area-coordinator';

        $assignedAreaIds = $user->areaAssignments()->pluck('area_id')->toArray();

        $areasQuery = Area::where('is_archived', false)
            ->with(['subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number')])
            ->orderBy('order_number');

        // Area coordinator → only assigned areas
        if ($isAreaCoord) {
            $areasQuery->whereIn('id', $assignedAreaIds);
        }
        // Dean + program-area-coordinator → all areas in their program (no restriction here,
        // program is separately scoped below)

        $areas = $areasQuery->get()->map(fn ($area) => [
            'id'   => $area->id,
            'name' => $area->name,
            'sub_areas' => $area->subAreas->map(fn ($sa) => [
                'id'   => $sa->id,
                'name' => $sa->name,
            ])->values(),
        ]);

        $program = $user->program_id
            ? Program::find($user->program_id)
            : null;

        return response()->json([
            'program' => $program ? ['id' => $program->id, 'name' => $program->name, 'code' => $program->code] : null,
            'areas'   => $areas,
        ]);
    }

    /**
     * Store a new document OR add a new version — allowed for dean, program-area-coordinator,
     * and area-coordinator (all 3 roles with area access).
     */
    public function store(StoreDocumentRequest $request)
    {
        $this->authorize('create', Document::class);

        $document = $this->documentService->storeDocument(
            $request->validated(),
            $request->file('file'),
            $request->user()
        );

        $message = $document->wasRecentlyCreated 
            ? 'Evidence uploaded successfully!' 
            : "Version {$document->current_version} uploaded. Document is now pending review.";

        return back()->with('success', $message);
    }

    /**
     * Dean: Approve a document slot.
     */
    public function approve(Document $document, ApproveDocumentRequest $request)
    {
        $this->authorize('approve', $document);

        $this->documentService->approveDocument($document, $request->user());

        return back()->with('success', "\"{$document->title}\" approved.");
    }

    /**
     * Dean: Reject a document slot.
     */
    public function reject(Document $document, RejectDocumentRequest $request)
    {
        $this->authorize('reject', $document);

        $this->documentService->rejectDocument($document, $request->user(), $request->reason);

        return back()->with('success', "\"{$document->title}\" rejected.");
    }

    /**
     * Download the latest version of a document.
     */
    public function download(Document $document, Request $request)
    {
        $this->authorize('download', $document);

        $version = $document->latestVersion();
        if (!$version) abort(404);

        $path = $this->documentService->getSecureDownloadPath($version);
        if (!$path) abort(404);

        return response()->download($path, $version->original_filename);
    }

    /**
     * Download a specific version of a document.
     */
    public function downloadVersion(Document $document, int $versionNumber)
    {
        $this->authorize('download', $document);

        $version = $document->versions()->where('version_number', $versionNumber)->first();
        if (!$version) abort(404);

        $path = $this->documentService->getSecureDownloadPath($version);
        if (!$path) abort(404);

        return response()->download($path, $version->original_filename);
    }

    /**
     * Show document detail page.
     */
    public function show(Document $document)
    {
        $document->load([
            'subArea.area',
            'program',
            'uploader',
            'versions.uploader',
            'workflowActions.actor',
            'evaluations.standard',
            'evaluations.findings',
        ]);

        $latestEvaluation = $document->evaluations->sortByDesc('created_at')->first();
        $availableStandards = Standard::query()
            ->where('is_active', true)
            ->where('index_status', 'indexed')
            ->where(function ($query) use ($document) {
                $query->whereNull('sub_area_id')
                    ->orWhere('sub_area_id', $document->sub_area_id);
            })
            ->where(function ($query) use ($document) {
                $query->whereNull('doc_type')
                    ->orWhere('doc_type', $document->doc_type);
            })
            ->with(['area', 'subArea', 'rubric'])
            ->orderBy('title')
            ->get();

        return Inertia::render('Documents/Show', [
            'document' => [
                'id'               => $document->id,
                'title'            => $document->title,
                'doc_type'         => $document->doc_type,
                'status'           => $document->status,
                'approval_status'  => $document->approval_status ?? 'pending',
                'rejection_reason' => $document->rejection_reason,
                'sub_area'         => $document->subArea->name,
                'area'             => $document->subArea->area->name,
                'program'          => $document->program->name,
                'uploader'         => $document->uploader?->name,
                'version'          => 'v' . $document->current_version,
                'versions'         => $document->versions->map(fn ($v) => [
                    'id'             => $v->id,
                    'version_number' => $v->version_number,
                    'original_filename' => $v->original_filename,
                    'file_size_bytes' => $v->file_size_bytes,
                    'uploaded_by'    => $v->uploader?->name,
                    'uploaded_at'    => $v->created_at->toIso8601String(),
                    'scan_status'    => $v->scan_status,
                    'notes'          => $v->notes,
                    'index_status'   => $v->index_status,
                ]),
                'workflow' => $document->workflowActions->map(fn ($a) => [
                    'action'  => $a->action,
                    'actor'   => $a->actor?->name,
                    'comment' => $a->comment,
                    'at'      => $a->acted_at->format('M j, Y H:i'),
                ]),
            ],
            'availableStandards' => $availableStandards->map(fn (Standard $standard) => [
                'id' => $standard->id,
                'title' => $standard->title,
                'code' => $standard->code,
                'doc_type' => $standard->doc_type,
                'area' => $standard->area?->name,
                'sub_area' => $standard->subArea?->name,
                'rubric' => $standard->rubric?->title,
                'index_status' => $standard->index_status,
            ]),
            'latestEvaluation' => $latestEvaluation ? [
                'id' => $latestEvaluation->id,
                'status' => $latestEvaluation->status,
                'status_label' => $latestEvaluation->status_label,
                'total_score' => $latestEvaluation->total_score,
                'max_score' => $latestEvaluation->max_score,
                'neutral_summary' => $latestEvaluation->neutral_summary,
                'matched_requirements_count' => $latestEvaluation->matched_requirements_count,
                'missing_requirements_count' => $latestEvaluation->missing_requirements_count,
                'unclear_items_count' => $latestEvaluation->unclear_items_count,
                'standard' => $latestEvaluation->standard?->title,
                'completed_at' => optional($latestEvaluation->completed_at)->toIso8601String(),
                'findings' => $latestEvaluation->findings->map(fn (EvaluationFinding $finding) => [
                    'id' => $finding->id,
                    'finding_type' => $finding->finding_type,
                    'requirement_key' => $finding->requirement_key,
                    'title' => $finding->title,
                    'details' => $finding->details,
                    'evidence' => $finding->evidence ?? [],
                ])->values()->all(),
            ] : null,
        ]);
    }
}
