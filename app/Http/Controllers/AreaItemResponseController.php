<?php

namespace App\Http\Controllers;

use App\Models\AreaItem;
use App\Models\AreaItemResponse;
use App\Models\SubArea;
use App\Models\AccreditationCycle;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Item-response endpoints for the IPO instrument tree.
 *
 * Workflow note (May 2026): submission/approval was removed. This controller now
 * only handles reading items and saving responses. Returns/resolves live in
 * RevisionReturnController.
 */
class AreaItemResponseController extends Controller
{
    /**
     * Return all items for a sub-area, grouped by IPO type, with the
     * current program's response attached.
     */
    public function subAreaItems(Request $request, SubArea $subArea)
    {
        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();

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

        // JSON for AJAX (Management panel + return modal selectors)
        if ($request->ajax() && !$request->hasHeader('X-Inertia')) {
            return response()->json([
                'items'    => $grouped,
                'sub_area' => ['id' => $subArea->id, 'name' => $subArea->name],
            ]);
        }

        $scores = $this->computeScores($subArea->id, $programId, $cycle?->id);

        return Inertia::render('Areas/SubAreaDetail', [
            'subArea'   => [
                'id'      => $subArea->id,
                'name'    => $subArea->name,
                'area_id' => $subArea->area_id,
                'area'    => ['id' => $subArea->area->id, 'name' => $subArea->area->name],
            ],
            'items'     => $grouped,
            'scores'    => $scores,
            'cycle'     => $cycle ? ['id' => $cycle->id, 'name' => $cycle->name] : null,
            'authRole'  => $user->roles->first()?->slug,
            'programId' => $programId,
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

        $values = [
            'status'     => 'draft',
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ];

        if ($request->has('content_json')) $values['content_json'] = $validated['content_json'] ?? null;
        if ($request->has('content_text')) $values['content_text'] = $validated['content_text'] ?? null;
        if ($request->has('rating'))       $values['rating']       = $validated['rating']       ?? null;

        $response = AreaItemResponse::updateOrCreate(
            [
                'area_item_id' => $item->id,
                'program_id'   => $programId,
                'cycle_id'     => $cycle?->id,
            ],
            $values
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
                'caption'           => $f->caption,
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
                'id'          => $response->id,
                'status'      => $response->status,
                'rating'      => $response->rating,
                'has_content' => !empty($response->content_text),
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
