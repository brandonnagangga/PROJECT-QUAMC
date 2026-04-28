<?php

namespace App\Http\Controllers;

use App\Models\AreaItem;
use App\Models\AreaItemFile;
use App\Models\AreaItemResponse;
use App\Models\AreaNote;
use App\Models\AreaSubmission;
use App\Models\SubArea;
use App\Models\AccreditationCycle;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AreaItemResponseController extends Controller
{
    /**
     * Return all items for a sub-area, grouped by IPO type,
     * enriched with the current program's response + files.
     */
    public function subAreaItems(Request $request, SubArea $subArea)
    {
        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();

        // Build item tree: top-level items → children ordered
        $items = AreaItem::with(['children' => fn($q) => $q->active()->orderBy('order_number')])
            ->where('sub_area_id', $subArea->id)
            ->active()
            ->whereNull('parent_item_id')
            ->orderBy('ipo_type')
            ->orderBy('order_number')
            ->get()
            ->map(fn($item) => $this->itemWithResponse($item, $programId, $cycle?->id));

        $grouped = [
            'input'   => $items->where('ipo_type', 'input')->values(),
            'process' => $items->where('ipo_type', 'process')->values(),
            'outcome' => $items->where('ipo_type', 'outcome')->values(),
        ];

        // Return JSON only for pure fetch/AJAX calls (Management panel)
        // Inertia navigations send X-Inertia header — never return JSON to those
        if ($request->ajax() && !$request->hasHeader('X-Inertia')) {
            return response()->json([
                'items'     => $grouped,
                'sub_area'  => ['id' => $subArea->id, 'name' => $subArea->name],
            ]);
        }

        // Submission state for this area+program
        $submission = AreaSubmission::where('area_id', $subArea->area_id)
            ->where('program_id', $programId)
            ->when($cycle, fn($q) => $q->where('cycle_id', $cycle->id))
            ->first();

        // Weighted scores
        $scores = $this->computeScores($subArea->id, $programId, $cycle?->id);

        return Inertia::render('Areas/SubAreaDetail', [
            'subArea'    => [
                'id'       => $subArea->id,
                'name'     => $subArea->name,
                'area_id'  => $subArea->area_id,
                'area'     => ['id' => $subArea->area->id, 'name' => $subArea->area->name],
            ],
            'items'      => $grouped,
            'submission' => $submission ? [
                'id'           => $submission->id,
                'status'       => $submission->status,
                'submitted_at' => $submission->submitted_at?->format('M j, Y g:i A'),
                'return_notes' => $submission->return_notes,
            ] : null,
            'scores'     => $scores,
            'cycle'      => $cycle ? ['id' => $cycle->id, 'name' => $cycle->name] : null,
            'authRole'   => $user->roles->first()?->slug,
            'programId'  => $programId,
        ]);
    }

    /**
     * Upsert (save draft) a response for one item.
     */
    public function saveDraft(Request $request, AreaItem $item)
    {
        $user      = $request->user();
        $programId = $user->program_id;

        if (!$programId) {
            return response()->json(['message' => 'You are not assigned to a program.'], 403);
        }

        $validated = $request->validate([
            'content_json' => 'nullable|array',
            'content_text' => 'nullable|string',
            'rating'       => 'nullable|integer|min:0|max:5',
        ]);

        $cycle = AccreditationCycle::active();

        $response = AreaItemResponse::updateOrCreate(
            [
                'area_item_id' => $item->id,
                'program_id'   => $programId,
                'cycle_id'     => $cycle?->id,
            ],
            [
                'content_json' => $validated['content_json'] ?? null,
                'content_text' => $validated['content_text'] ?? null,
                'rating'       => $validated['rating'] ?? null,
                'status'       => 'draft',
                'created_by'   => $user->id,
                'updated_by'   => $user->id,
            ]
        );

        return response()->json([
            'success'     => true,
            'response_id' => $response->id,
            'message'     => 'Draft saved.',
        ]);
    }

    /**
     * Get a single item's response for the current program (JSON, for modal load).
     */
    public function getResponse(Request $request, AreaItem $item)
    {
        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();

        $response = AreaItemResponse::with('files')
            ->where('area_item_id', $item->id)
            ->where('program_id', $programId)
            ->when($cycle, fn($q) => $q->where('cycle_id', $cycle->id))
            ->first();

        $files = $response
            ? $response->files->map(fn($f) => [
                'id'                => $f->id,
                'original_filename' => $f->original_filename,
                'file_size_bytes'   => $f->file_size_bytes,
                'size_formatted'    => $f->fileSizeFormatted(),
                'mime_type'         => $f->mime_type,
                'scan_status'       => $f->scan_status,
            ])
            : [];

        return response()->json([
            'id'           => $response?->id,
            'content_json' => $response ? json_decode($response->getRawOriginal('content_json'), true) : null,
            'content_text' => $response?->content_text,
            'rating'       => $response?->rating,
            'status'       => $response?->status ?? 'draft',
            'files'        => $files,
        ]);
    }

    /**
     * Submit the entire AREA to the Dean.
     * Locks all items in all sub-areas of this area for this program.
     */
    public function submitArea(Request $request, $areaId)
    {
        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();

        if (!$user->hasRole(['area-coordinator', 'program-coordinator'])) {
            return back()->with('error', 'Only coordinators can submit areas to the Dean.');
        }

        if (!$programId) {
            return back()->withErrors(['program' => 'No program assigned.']);
        }

        $area = \App\Models\Area::find($areaId);

        $existing = AreaSubmission::where('area_id', $areaId)
            ->where('program_id', $programId)
            ->when($cycle, fn($q) => $q->where('cycle_id', $cycle->id))
            ->first();

        if ($existing && in_array($existing->status, ['submitted', 'submitted_to_director', 'approved'])) {
            return back()->with('error', 'This area has already been submitted.');
        }

        $submission = AreaSubmission::updateOrCreate(
            [
                'area_id'    => $areaId,
                'program_id' => $programId,
                'cycle_id'   => $cycle?->id,
            ],
            [
                'status'       => 'submitted',
                'submitted_by' => $user->id,
                'submitted_at' => now(),
            ]
        );

        // ── Notify Dean(s) of this program ──────────────────────
        $areaName = $area?->name ?? 'an area';
        NotificationService::notifyRole(
            'dean',
            'area.submitted_to_dean',
            "Area coordinator {$user->name} submitted \"{$areaName}\" for your review.",
            $programId,
            $areaId,
            "/sub-areas/" . ($area?->subAreas?->first()?->id ?? '') . "/items"
        );

        // ── Activity log ────────────────────────────────────────
        $program = \App\Models\Program::find($programId);
        ActivityLogService::log($user, 'area.submitted_to_dean', $area, [
            'area_name'    => $areaName,
            'program_name' => $program?->name ?? '',
        ], $request->ip());

        return back()->with('success', 'Area submitted to Dean successfully.');
    }

    /**
     * Dean returns an area for revision.
     * Supports multi-select sub-areas: the chosen sub-areas get returned_by_dean status.
     * Area-level AreaSubmission status becomes 'returned'.
     */
    public function returnArea(Request $request, AreaSubmission $submission)
    {
        $request->validate([
            'notes'          => 'nullable|string|max:2000',
            'sub_area_ids'   => 'nullable|array',
            'sub_area_ids.*' => 'integer|exists:sub_areas,id',
        ]);

        $user = $request->user();
        $isDean = $user->hasRole('dean');
        $isDirector = $user->hasRole('director');

        if (!$isDean && !$isDirector) {
            return back()->with('error', 'Only the Dean or Director can return areas.');
        }

        if ($isDean && $submission->status !== 'submitted') {
            return back()->with('error', 'Area is not awaiting Dean review.');
        }

        if ($isDirector && $submission->status !== 'submitted_to_director') {
            return back()->with('error', 'Area is not awaiting Director review.');
        }

        // Update area-level submission status
        $submission->update([
            'status'       => 'returned',
            'reviewed_by'  => $user->id,
            'reviewed_at'  => now(),
            'return_notes' => $request->notes ?? null,
        ]);

        // Keep legacy sub-area badges aligned with the area-level return.
        if (!empty($request->sub_area_ids)) {
            SubArea::where('area_id', $submission->area_id)
                ->whereIn('id', $request->sub_area_ids)
                ->update(['submission_status' => $isDirector ? 'returned' : 'returned_by_dean']);
        }

        // Create an area note of type 'return' if a comment was provided
        if (!empty($request->notes)) {
            AreaNote::create([
                'area_id'    => $submission->area_id,
                'program_id' => $submission->program_id,
                'user_id'    => $user->id,
                'type'       => 'return',
                'content'    => $request->notes,
            ]);
        }

        // ── Notify the coordinator who submitted ────────────────
        $submission->load(['area', 'submitter', 'program']);
        $areaName = $submission->area?->name ?? 'an area';

        if ($submission->submitted_by) {
            NotificationService::send(
                $submission->submitted_by,
                'area.returned_by_dean',
                ($isDirector ? 'Director' : 'Dean') . " {$user->name} returned \"{$areaName}\" for revision. Open to view notes.",
                $submission->area_id,
                "/sub-areas/" . ($submission->area?->subAreas?->first()?->id ?? '') . "/items"
            );
        }
        // Also notify all coordinators of that program
        NotificationService::notifyRole(
            'area-coordinator',
            'area.returned_by_dean',
            ($isDirector ? 'Director' : 'Dean') . " {$user->name} returned \"{$areaName}\" for revision. Open to view notes.",
            $submission->program_id,
            $submission->area_id,
            "/sub-areas/" . ($submission->area?->subAreas?->first()?->id ?? '') . "/items"
        );

        ActivityLogService::log($user, 'area.returned_by_dean', $submission->area, [
            'area_name'    => $areaName,
            'program_name' => $submission->program?->name ?? '',
        ], $request->ip());

        return back()->with('success', 'Area returned for revision.');
    }

    /**
     * Dean submits an area to the Director.
     */
    public function submitAreaToDirector(Request $request, $areaId)
    {
        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();

        if (!$user->hasRole('dean')) {
            return back()->with('error', 'Only the Dean can submit areas to the Director.');
        }

        if (!$programId) {
            return back()->withErrors(['program' => 'No program assigned.']);
        }

        $submission = AreaSubmission::where('area_id', $areaId)
            ->where('program_id', $programId)
            ->when($cycle, fn ($q) => $q->where('cycle_id', $cycle->id))
            ->first();

        if (!$submission || $submission->status !== 'submitted') {
            return back()->with('error', 'Area must be submitted to Dean first before forwarding to Director.');
        }

        $submission->update([
            'status'      => 'submitted_to_director',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        $area     = \App\Models\Area::find($areaId);
        $areaName = $area?->name ?? 'an area';
        $program  = \App\Models\Program::find($programId);

        NotificationService::notifyRole(
            'director',
            'area.submitted_to_director',
            "Dean {$user->name} submitted \"{$areaName}\" for Director review.",
            $programId,
            $areaId,
            "/areas"
        );

        ActivityLogService::log($user, 'area.submitted_to_director', $area, [
            'area_name'    => $areaName,
            'program_name' => $program?->name ?? '',
        ], $request->ip());

        return back()->with('success', 'Area submitted to Director.');
    }

    /**
     * Dean approves an area.
     */
    public function approveArea(Request $request, AreaSubmission $submission)
    {
        $user = $request->user();

        if (!$user->hasRole('director')) {
            return back()->with('error', 'Only the Director can give final approval.');
        }

        if ($submission->status !== 'submitted_to_director') {
            return back()->with('error', 'Area must be submitted to Director before final approval.');
        }

        $submission->update([
            'status'      => 'approved',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        $submission->load(['area', 'submitter', 'program']);
        $areaName = $submission->area?->name ?? 'an area';

        // Notify submitting coordinator
        if ($submission->submitted_by) {
            NotificationService::send(
                $submission->submitted_by,
                'area.approved_by_director',
                "Director {$user->name} approved \"{$areaName}\".",
                $submission->area_id
            );
        }

        ActivityLogService::log($user, 'area.approved_by_director', $submission->area, [
            'area_name'    => $areaName,
            'program_name' => $submission->program?->name ?? '',
        ], $request->ip());

        return back()->with('success', 'Area approved by Director.');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function itemWithResponse(AreaItem $item, ?int $programId, ?int $cycleId): array
    {
        $response = $programId
            ? AreaItemResponse::where('area_item_id', $item->id)
                ->where('program_id', $programId)
                ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                ->first()
            : null;

        $children = $item->children->map(fn($child) => $this->itemWithResponse($child, $programId, $cycleId))->values();

        return [
            'id'           => $item->id,
            'label'        => $item->label,
            'ipo_type'     => $item->ipo_type,
            'order_number' => $item->order_number,
            'is_sub_item'  => $item->isSubItem(),
            'response'     => $response ? [
                'id'           => $response->id,
                'status'       => $response->status,
                'rating'       => $response->rating,
                'has_content'  => !empty($response->content_text),
            ] : null,
            'children'     => $children,
        ];
    }

    private function computeScores(int $subAreaId, ?int $programId, ?int $cycleId): array
    {
        if (!$programId) return ['input' => null, 'process' => null, 'outcome' => null, 'weighted' => null];

        $weights = ['input' => 0.20, 'process' => 0.30, 'outcome' => 0.50];
        $scores  = [];
        $weighted = 0.0;

        foreach (['input', 'process', 'outcome'] as $type) {
            $itemIds = AreaItem::where('sub_area_id', $subAreaId)
                ->where('ipo_type', $type)
                ->active()
                ->pluck('id');

            $ratings = AreaItemResponse::whereIn('area_item_id', $itemIds)
                ->where('program_id', $programId)
                ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                ->whereNotNull('rating')
                ->pluck('rating');

            $avg = $ratings->count() > 0 ? round($ratings->avg(), 2) : null;
            $scores[$type] = $avg;
            if ($avg !== null) $weighted += $avg * $weights[$type];
        }

        $scores['weighted'] = round($weighted, 2);
        return $scores;
    }
}
