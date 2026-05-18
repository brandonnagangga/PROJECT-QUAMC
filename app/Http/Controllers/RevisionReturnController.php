<?php

namespace App\Http\Controllers;

use App\Models\AccreditationCycle;
use App\Models\AreaItem;
use App\Models\Program;
use App\Models\RevisionReturn;
use App\Models\SubArea;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * RevisionReturnController
 *
 * Handles the new "Return for Revision" workflow that replaced the old
 * submit/approve/forward chain.
 *
 *  - Only Dean and Director may CREATE a return.
 *  - Resolution rules:
 *      • Director-returned → only area-coordinator / program-coordinator can resolve
 *      • Dean-returned     → any authenticated role can resolve
 */
class RevisionReturnController extends Controller
{
    /**
     * Create a new return on a sub-area, item, or sub-item.
     */
    public function store(Request $request)
    {
        $user = $request->user()->load('roles');
        $roleSlug = $user->roles->first()?->slug;

        if (!in_array($roleSlug, ['dean', 'director'], true)) {
            return back()->with('error', 'Only the Dean or Director can return for revision.');
        }

        $data = $request->validate([
            'target_type'  => ['required', Rule::in(['sub_area', 'item'])],
            'target_id'    => 'required|integer|min:1',
            'program_id'   => 'required|exists:programs,id',
            'comment'      => 'nullable|string|max:2000',
        ]);

        // Resolve target
        if ($data['target_type'] === 'sub_area') {
            $subArea = SubArea::findOrFail($data['target_id']);
            $returnable = $subArea;
            $subAreaId = $subArea->id;
        } else {
            $item = AreaItem::findOrFail($data['target_id']);
            $returnable = $item;
            $subAreaId = $item->sub_area_id;
        }

        // Dean is restricted to their own program
        if ($roleSlug === 'dean' && $user->program_id && (int) $data['program_id'] !== (int) $user->program_id) {
            return back()->with('error', 'Deans can only return content within their own program.');
        }

        $cycle = AccreditationCycle::active();

        // De-duplicate: if there's already an active return on this exact target+program,
        // append the new comment instead of creating a parallel record.
        $existing = RevisionReturn::active()
            ->where('returnable_type', $returnable->getMorphClass())
            ->where('returnable_id', $returnable->id)
            ->where('program_id', $data['program_id'])
            ->first();

        if ($existing) {
            $existing->update([
                'comment'         => trim(($existing->comment ?? '') . "\n" . ($data['comment'] ?? '')),
                'returned_by'     => $user->id,
                'returned_by_role'=> $roleSlug,
            ]);
            return back()->with('success', 'Return updated with new comment.');
        }

        RevisionReturn::create([
            'returnable_type'  => $returnable->getMorphClass(),
            'returnable_id'    => $returnable->id,
            'sub_area_id'      => $subAreaId,
            'program_id'       => $data['program_id'],
            'cycle_id'         => $cycle?->id,
            'returned_by'      => $user->id,
            'returned_by_role' => $roleSlug,
            'comment'          => $data['comment'] ?? null,
        ]);

        return back()->with('success', 'Returned for revision.');
    }

    /**
     * Mark a return as resolved.
     *
     * Resolution rules:
     *   - Director-returned → only area-coordinator / program-coordinator
     *   - Dean-returned     → any authenticated role
     */
    public function resolve(RevisionReturn $return, Request $request)
    {
        if (!$return->isActive()) {
            return back()->with('error', 'This return is already resolved.');
        }

        $user = $request->user()->load('roles');
        $roleSlug = $user->roles->first()?->slug ?? '';

        if ($return->returned_by_role === 'director') {
            $allowed = in_array($roleSlug, ['area-coordinator', 'program-coordinator'], true);
            if (!$allowed) {
                return back()->with('error', 'Only the assigned coordinator can resolve a Director return.');
            }
        }
        // Dean-returned → any role allowed

        // Dean can only resolve within their program (defensive)
        if ($roleSlug === 'dean' && $user->program_id && (int) $return->program_id !== (int) $user->program_id) {
            return back()->with('error', 'Out of program scope.');
        }

        $return->update([
            'resolved_at' => now(),
            'resolved_by' => $user->id,
        ]);

        return back()->with('success', 'Return marked as resolved.');
    }
}
