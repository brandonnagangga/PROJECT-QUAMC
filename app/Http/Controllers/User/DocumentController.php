<?php

namespace App\Http\Controllers\User;

use App\Events\DocumentStatusChanged;
use App\Http\Controllers\Controller;
use App\Jobs\ScanUploadedFile;
use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaItem;
use App\Models\AreaItemFile;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Notification;
use App\Models\Program;
use App\Models\SubArea;
use App\Models\User;
use App\Models\WorkflowAction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentController extends Controller
{
    private function resolveStoredFilePath(string $filePath): ?string
    {
        $normalized = ltrim($filePath, '/');
        $candidates = [
            storage_path('app/' . $normalized),
            storage_path('app/private/' . $normalized),
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function resolveFallbackPdfPath(): ?string
    {
        $candidate = base_path('QUAMC_System_Design.pdf');
        return file_exists($candidate) ? $candidate : null;
    }

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

        // ── Cycle viewing context (same as Areas page) ──
        $activeCycle     = AccreditationCycle::active();
        $viewingCycleId  = $request->session()->get('viewing_cycle_id', $activeCycle?->id);
        $viewingCycle    = $viewingCycleId ? AccreditationCycle::find($viewingCycleId) : $activeCycle;
        $isViewingPast   = $viewingCycleId && $viewingCycleId !== ($activeCycle?->id);

        // All programs are visible to everyone
        $programs = Program::where('is_active', true)
            ->get()
            ->map(function ($program) use ($user, $role, $canAct, $isDean, $assignedAreaIds, $isAreaCoord, $viewingCycleId) {
                // All areas are visible to everyone
                $areasQuery = Area::where('is_archived', false)
                    ->orderBy('order_number')
                    ->with(['subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number')]);

                $areas = $areasQuery->get()->map(function ($area) use ($program, $user, $role, $canAct, $isDean, $assignedAreaIds, $isAreaCoord, $viewingCycleId) {
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
                        'sub_areas' => $area->subAreas->map(function ($sa) use ($program, $user, $role, $canEditThisSlot, $canApproveThisSlot, $viewingCycleId) {
                            $docs = Document::where('sub_area_id', $sa->id)
                                ->where('program_id', $program->id)
                                ->when($viewingCycleId, fn ($q) => $q->where('cycle_id', $viewingCycleId))
                                ->with(['uploader', 'versions'])
                                ->get()
                                ->keyBy('doc_type');

                            $slot = fn ($type) => $docs->has($type) ? [
                                'id'              => $docs[$type]->id,
                                'title'           => $docs[$type]->title,
                                'status'          => $docs[$type]->status,
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
        $filters   = $request->only(['search', 'status']);
        $docsQuery = Document::with(['subArea.area', 'program', 'uploader'])
            ->when($viewingCycleId, fn ($q) => $q->where('cycle_id', $viewingCycleId))
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

        // ── AreaItemFile tree (the new item-level evidence browser) ──
        // Only load a program if explicitly requested — otherwise show the program picker grid
        $filterProgramId = $request->input('program_id')
            ? (int)$request->input('program_id')
            : null;

        $allCycles = AccreditationCycle::orderByDesc('start_date')->get()
            ->map(fn($c) => ['id' => $c->id, 'name' => $c->name])
            ->values();

        $itemTree = $filterProgramId
            ? $this->buildItemFilesTree($filterProgramId, $viewingCycleId)
            : [];

        // Pass all programs to every role for the program selector
        $allPrograms = Program::where('is_active', true)
            ->get()
            ->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code])
            ->values();

        return Inertia::render('Documents/Index', [
            'documents'          => $documents,
            'programs'           => $programs,
            'filters'            => $filters,
            'role'               => $role,
            'can_act'            => $canAct,
            'is_viewing_past'    => $isViewingPast,
            'viewing_cycle_name' => $viewingCycle?->name,
            // New tree props
            'item_files_tree'    => $itemTree,
            'all_cycles'         => $allCycles,
            'all_programs'       => $allPrograms,
            'filter_program_id'  => $filterProgramId,
        ]);
    }

    /**
     * Build the Area → SubArea → IPO → Item → Files tree for the Documents page.
     */
    private function buildItemFilesTree(int $programId, ?int $cycleId): array
    {
        $areas = Area::where('is_archived', false)
            ->orderBy('order_number')
            ->with(['subAreas' => function ($q) {
                $q->where('is_archived', false)->orderBy('order_number');
            }])
            ->get();

        return $areas->map(function ($area) use ($programId, $cycleId) {
            $subAreas = $area->subAreas->map(function ($sa) use ($programId, $cycleId) {
                // Load top-level items with their children
                $items = AreaItem::where('sub_area_id', $sa->id)
                    ->whereNull('parent_item_id')
                    ->where('is_archived', false)
                    ->orderBy('ipo_type')
                    ->orderBy('order_number')
                    ->with(['children' => function ($q) {
                        $q->where('is_archived', false)->orderBy('order_number');
                    }])
                    ->get();

                // Load all files for this sub_area scoped by program + cycle
                $fileQuery = AreaItemFile::where('program_id', $programId)
                    ->whereIn('area_item_id', $items->pluck('id')
                        ->merge($items->flatMap(fn($i) => $i->children->pluck('id')))
                        ->unique())
                    ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                    ->with('uploader')
                    ->get()
                    ->groupBy('area_item_id');

                $mapItem = function ($item) use ($fileQuery, $programId) {
                    $files = ($fileQuery[$item->id] ?? collect())->map(fn($f) => [
                        'id'                => $f->id,
                        'original_filename' => $f->original_filename,
                        'mime_type'         => $f->mime_type,
                        'file_size'         => $f->fileSizeFormatted(),
                        'uploader'          => $f->uploader?->name ?? '—',
                        'uploaded_at'       => $f->created_at->format('M j, Y'),
                        'download_url'      => route('documents.item-file.download', $f->id),
                        'preview_url'       => route('item-files.preview', $f->id),
                    ])->values()->toArray();

                    return [
                        'id'       => $item->id,
                        'label'    => $item->label,
                        'ipo_type' => $item->ipo_type,
                        'files'    => $files,
                    ];
                };

                // Group by IPO type
                $grouped = ['input' => [], 'process' => [], 'outcome' => []];
                foreach ($items as $item) {
                    $mapped = $mapItem($item);
                    // Attach sub-items
                    $mapped['children'] = $item->children->map($mapItem)->values()->toArray();
                    $type = $item->ipo_type ?? 'input';
                    $grouped[$type][] = $mapped;
                }

                $totalFiles = collect($fileQuery)->flatten(1)->count();

                return [
                    'id'          => $sa->id,
                    'name'        => $sa->name,
                    'total_files' => $totalFiles,
                    'groups'      => $grouped,
                ];
            })->values()->toArray();

            $areaTotal = array_sum(array_column($subAreas, 'total_files'));

            return [
                'id'          => $area->id,
                'name'        => $area->name,
                'total_files' => $areaTotal,
                'sub_areas'   => $subAreas,
            ];
        })->values()->toArray();
    }

    /**
     * Download an AreaItemFile by ID.
     */
    public function downloadItemFile(AreaItemFile $file)
    {
        $path = storage_path('app/private/' . $file->file_path);
        if (!file_exists($path)) {
            $path = storage_path('app/' . $file->file_path);
        }
        if (!file_exists($path)) abort(404);
        return response()->download($path, $file->original_filename);
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
    public function store(Request $request)
    {
        $request->validate([
            'sub_area_id' => 'required|exists:sub_areas,id',
            'program_id'  => 'required|exists:programs,id',
            'doc_type'    => 'required|in:input,process,outcome',
            'file'        => 'required|file|max:51200',
            'title'       => 'required|string|max:255',
            'notes'       => 'nullable|string',
        ]);

        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        // ── Cycle lock check ──────────────────────────────────────────────────
        $activeCycle = AccreditationCycle::active();
        if (!$activeCycle) {
            return back()->with('error', 'No active accreditation cycle. A Director must activate a cycle before documents can be uploaded.');
        }
        if ($activeCycle->end_date->isPast()) {
            return back()->with('error', "The accreditation cycle \"{$activeCycle->name}\" ended on {$activeCycle->end_date->format('M j, Y')}. Uploads are locked until a new cycle is activated.");
        }
        // ─────────────────────────────────────────────────────────────────────

        if (!in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            return back()->with('error', 'You do not have permission to upload evidence.');
        }

        if ($user->program_id != $request->program_id) {
            return back()->with('error', 'You can only upload evidence for your assigned program.');
        }

        if ($role === 'area-coordinator') {
            $subArea = \App\Models\SubArea::find($request->sub_area_id);
            if (!$subArea || !in_array($subArea->area_id, $user->areaAssignments()->pluck('area_id')->toArray())) {
                return back()->with('error', 'You can only upload evidence for your assigned areas.');
            }
        }

        // Check if a document already exists for this slot — if so, add a new version
        $existing = Document::where('sub_area_id', $request->sub_area_id)
            ->where('program_id', $request->program_id)
            ->where('doc_type', $request->doc_type)
            ->first();

        if ($existing) {
            return $this->addVersion($existing, $request);
        }

        $file    = $request->file('file');
        $path    = $file->store('documents', 'local');

        $document = Document::create([
            'sub_area_id'     => $request->sub_area_id,
            'program_id'      => $request->program_id,
            'cycle_id'        => $activeCycle?->id,   // nullable if no cycle configured yet
            'doc_type'        => $request->doc_type,
            'uploaded_by'     => $user->id,
            'title'           => $request->title,
            'status'          => 'draft',
            'approval_status' => 'pending',
            'current_version' => 1,
        ]);

        $version = DocumentVersion::create([
            'document_id'       => $document->id,
            'uploaded_by'       => $user->id,
            'version_number'    => 1,
            'file_path'         => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size_bytes'   => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'notes'             => $request->notes,
            'scan_status'       => 'pending',
        ]);

        ScanUploadedFile::dispatch($version);
        event(new DocumentStatusChanged($document, $user, 'uploaded'));

        return back()->with('success', 'Evidence uploaded successfully!');
    }

    /**
     * Add a new version to an existing document (edit = new version, never overwrite).
     * Open to all 3 allowed roles.
     */
    private function addVersion(Document $document, Request $request)
    {
        $file       = $request->file('file');
        $path       = $file->store('documents', 'local');
        $newVersion = $document->current_version + 1;

        $version = DocumentVersion::create([
            'document_id'       => $document->id,
            'uploaded_by'       => $request->user()->id,
            'version_number'    => $newVersion,
            'file_path'         => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size_bytes'   => $file->getSize(),
            'mime_type'         => $file->getClientMimeType(),
            'notes'             => $request->notes,
            'scan_status'       => 'pending',
        ]);

        // Re-set approval. If previously rejected, set to needs_resubmit
        // so coordinator must explicitly click "Submit for Review" again.
        $wasRejected = in_array($document->approval_status, ['rejected']);
        $newApprovalStatus = $wasRejected ? 'needs_resubmit' : 'pending';

        $document->update([
            'current_version' => $newVersion,
            'status'          => 'draft',
            'approval_status' => $newApprovalStatus,
        ]);

        ScanUploadedFile::dispatch($version);
        event(new DocumentStatusChanged($document, $request->user(), 'uploaded new version'));

        $msg = $wasRejected
            ? "Version {$newVersion} uploaded. Click 'Submit for Review' to notify the Dean."
            : "Version {$newVersion} uploaded. Document is now pending review.";

        return back()->with('success', $msg);
    }

    /**
     * Dean: Approve a document slot.
     */
    public function approve(Document $document, Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'dean') {
            return back()->with('error', 'Only Deans can approve documents.');
        }

        if ($user->program_id !== $document->program_id) {
            return back()->with('error', 'You can only approve documents for your assigned program.');
        }

        $document->update([
            'approval_status' => 'approved',
            'rejection_reason' => null,
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        event(new DocumentStatusChanged($document, $user, 'approved'));

        return back()->with('success', "\"{$document->title}\" approved.");
    }

    /**
     * Dean: Reject a document slot.
     */
    public function reject(Document $document, Request $request)
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'dean') {
            return back()->with('error', 'Only Deans can reject documents.');
        }

        if ($user->program_id !== $document->program_id) {
            return back()->with('error', 'You can only reject documents for your assigned program.');
        }

        $document->update([
            'approval_status'  => 'rejected',
            'rejection_reason' => $request->reason,
            'approved_by'      => $user->id,
            'approved_at'      => now(),
        ]);

        event(new DocumentStatusChanged($document, $user, 'rejected'));

        return back()->with('success', "\"{$document->title}\" rejected.");
    }

    /**
     * Coordinator: formally re-submit a previously-rejected document for Dean review.
     * Sets approval_status back to 'pending' and notifies the Dean(s) of the program.
     */
    public function resubmit(Document $document, Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['area-coordinator', 'program-coordinator', 'dean'])) {
            return back()->with('error', 'Not authorized.');
        }

        if ($document->approval_status !== 'needs_resubmit') {
            return back()->with('error', 'This document does not need resubmission.');
        }

        $document->update(['approval_status' => 'pending']);

        // Notify all Dean users in this program
        $deans = User::whereHas('roles', fn ($q) => $q->where('slug', 'dean'))
            ->where('program_id', $document->program_id)
            ->get();

        foreach ($deans as $dean) {
            Notification::create([
                'user_id'     => $dean->id,
                'document_id' => $document->id,
                'type'        => 'resubmitted',
                'message'     => "{$user->name} resubmitted \"{$document->title}\" for your review.",
                'is_read'     => false,
            ]);
        }

        return back()->with('success', "\"{$document->title}\" resubmitted for Dean review.");
    }

    /**
     * Stream a document file inline for in-browser preview.
     * Supports PDF and image types. All others return a JSON error.
     */
    public function preview(Document $document, Request $request)
    {
        $version = $document->latestVersion();
        if (!$version) abort(404);

        $path = $this->resolveStoredFilePath($version->file_path);
        if (!$path) {
            $path = $this->resolveFallbackPdfPath();
        }
        if (!$path) abort(404);

        $mime = $version->mime_type ?? mime_content_type($path);
        $previewable = str_starts_with($mime, 'image/') || $mime === 'application/pdf';

        if (!$previewable) {
            return response()->json(['previewable' => false, 'mime' => $mime], 200);
        }

        return response()->file($path, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . $version->original_filename . '"',
        ]);
    }

    /**
     * Download the latest version of a document.
     */
    public function download(Document $document, Request $request)
    {
        $version = $document->latestVersion();
        if (!$version) abort(404);

        $path = $this->resolveStoredFilePath($version->file_path);
        if (!$path) {
            $path = $this->resolveFallbackPdfPath();
        }
        if (!$path) abort(404);

        return response()->download($path, $version->original_filename);
    }

    /**
     * Download a specific version of a document.
     */
    public function downloadVersion(Document $document, int $versionNumber)
    {
        $version = $document->versions()->where('version_number', $versionNumber)->first();
        if (!$version) abort(404);

        $path = $this->resolveStoredFilePath($version->file_path);
        if (!$path) {
            $path = $this->resolveFallbackPdfPath();
        }
        if (!$path) abort(404);

        return response()->download($path, $version->original_filename);
    }

    /**
     * Show document detail page.
     * Returns all fields expected by Documents/Show.tsx.
     */
    public function show(Document $document)
    {
        $document->load(['subArea.area', 'program', 'uploader', 'versions.uploader', 'workflowActions.actor']);

        return Inertia::render('Documents/Show', [
            'document' => [
                'id'               => $document->id,
                'title'            => $document->title,
                'doc_type'         => $document->doc_type,
                'status'           => $document->status,
                'approval_status'  => $document->approval_status ?? 'pending',
                'rejection_reason' => $document->rejection_reason,
                'version'          => 'v' . ((int) $document->current_version),
                'current_version'  => (int) $document->current_version,
                'sub_area'         => $document->subArea?->name,
                'area'             => $document->subArea?->area?->name,
                'program'          => $document->program?->name,
                'area_item'        => null, // old Document model — not item-based
                'uploader'         => $document->uploader?->name,
                'submitted_at'     => $document->submitted_at?->format('M j, Y H:i'),
                'created_at'       => $document->created_at->format('M j, Y'),
                'updated_at'       => $document->updated_at->format('M j, Y'),
                'versions'         => $document->versions->map(fn ($v) => [
                    'id'             => $v->id,
                    'version_number' => $v->version_number,
                    'original_filename' => $v->original_filename,
                    'file_size_bytes' => (int) $v->file_size_bytes,
                    'filename'       => $v->original_filename,
                    'mime_type'      => $v->mime_type,
                    'file_size'      => $v->fileSizeFormatted(),
                    'uploaded_by'    => $v->uploader?->name,
                    'uploaded_at'    => $v->created_at?->toISOString(),
                    'scan_status'    => $v->scan_status,
                    'notes'          => $v->notes,
                    'index_status'   => $v->index_status ?? 'pending',
                ])->values(),
                'workflow'        => $document->workflowActions->map(fn ($a) => [
                    'action'      => $a->action,
                    'actor'       => $a->actor?->name,
                    'comment'     => $a->comment,
                    'at'          => $a->acted_at?->toISOString() ?? $a->created_at?->toISOString(),
                ])->values(),
                'workflow_actions' => $document->workflowActions->map(fn ($a) => [
                    'id'          => $a->id,
                    'action'      => $a->action,
                    'actor'       => $a->actor
                        ? ['id' => $a->actor->id, 'name' => $a->actor->name]
                        : null,
                    'from_status' => $a->from_status,
                    'to_status'   => $a->to_status,
                    'comment'     => $a->comment,
                    'acted_at'    => $a->acted_at?->toISOString(),
                ])->values(),
            ],
            'availableStandards' => [],
            'latestEvaluation' => null,
        ]);
    }

    /**
     * Coordinator submits a document for Dean review.
     * Transitions: draft|returned → pending_review.
     */
    public function submitDocument(Document $document, Request $request)
    {
        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['area-coordinator', 'program-coordinator', 'dean'])) {
            return back()->with('error', 'Not authorized to submit documents.');
        }

        if (!in_array($document->status, ['draft', 'returned'])) {
            return back()->with('error', 'Only draft or returned documents can be submitted for review.');
        }

        $fromStatus = $document->status;

        $document->update([
            'status'          => 'pending_review',
            'approval_status' => 'pending',
            'submitted_at'    => now(),
        ]);

        WorkflowAction::create([
            'document_id' => $document->id,
            'actor_id'    => $user->id,
            'action'      => 'submitted',
            'from_status' => $fromStatus,
            'to_status'   => 'pending_review',
            'comment'     => $request->comment,
            'acted_at'    => now(),
        ]);

        // Notify all Deans of the program
        $deans = User::whereHas('roles', fn ($q) => $q->where('slug', 'dean'))
            ->where('program_id', $document->program_id)
            ->get();

        foreach ($deans as $dean) {
            Notification::create([
                'user_id'     => $dean->id,
                'document_id' => $document->id,
                'type'        => 'document.submitted',
                'message'     => "{$user->name} submitted \"{$document->title}\" for your review.",
                'is_read'     => false,
            ]);
        }

        event(new DocumentStatusChanged($document, $user, 'submitted'));

        return back()->with('success', "\"{$document->title}\" submitted for Dean review.");
    }

    /**
     * Dean workflow actions on Documents/Show page: approve, return, forward.
     */
    public function workflow(Document $document, Request $request)
    {
        $request->validate([
            'action'  => 'required|in:approve,return,forward',
            'comment' => 'nullable|string|max:500',
        ]);

        $user = $request->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'dean') {
            return back()->with('error', 'Only Deans can take workflow actions on documents.');
        }

        if ($user->program_id !== $document->program_id) {
            return back()->with('error', 'You can only act on documents for your assigned program.');
        }

        $action     = $request->action;
        $fromStatus = $document->approval_status ?? 'pending';

        if ($action === 'approve' || $action === 'forward') {
            $document->update([
                'approval_status'  => 'approved',
                'rejection_reason' => null,
                'approved_by'      => $user->id,
                'approved_at'      => now(),
            ]);
            $toStatus  = 'approved';
            $notifType = 'document.approved';
            $notifMsg  = "{$user->name} " . ($action === 'forward' ? 'forwarded & approved' : 'approved') . " \"{$document->title}\".'";
            $flash     = "\"{$document->title}\" approved successfully.";
        } else { // return
            $document->update([
                'approval_status'  => 'needs_resubmit',
                'rejection_reason' => $request->comment,
            ]);
            $toStatus  = 'needs_resubmit';
            $notifType = 'document.returned';
            $notifMsg  = "{$user->name} returned \"{$document->title}\" for revision."
                . ($request->comment ? " Reason: {$request->comment}" : '');
            $flash     = "\"{$document->title}\" returned for revision.";
        }

        WorkflowAction::create([
            'document_id' => $document->id,
            'actor_id'    => $user->id,
            'action'      => $action,
            'from_status' => $fromStatus,
            'to_status'   => $toStatus,
            'comment'     => $request->comment,
            'acted_at'    => now(),
        ]);

        // Notify the uploader
        if ($document->uploaded_by) {
            Notification::create([
                'user_id'     => $document->uploaded_by,
                'document_id' => $document->id,
                'type'        => $notifType,
                'message'     => $notifMsg,
                'is_read'     => false,
            ]);
        }

        event(new DocumentStatusChanged($document, $user, $action));

        return back()->with('success', $flash);
    }
}
