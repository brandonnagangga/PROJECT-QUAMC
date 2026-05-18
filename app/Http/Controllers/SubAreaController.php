<?php

namespace App\Http\Controllers;

use App\Models\SubArea;
use Illuminate\Http\Request;

/**
 * Director-only CRUD for SubAreas.
 *
 * The old submission/approval workflow (submit/forward/approve) was removed
 * in favour of the simpler RevisionReturn model. See RevisionReturnController.
 */
class SubAreaController extends Controller
{
    public function store(Request $request)
    {
        if (!$request->user()->hasRole('director')) {
            return back()->with('error', 'Only the Director can create sub-areas.');
        }

        $data = $request->validate([
            'area_id'      => 'required|exists:areas,id',
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
        ]);

        $subArea = SubArea::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "Sub-area \"{$subArea->name}\" created.");
    }

    public function update(SubArea $subArea, Request $request)
    {
        if (!$request->user()->hasRole('director')) {
            return back()->with('error', 'Only the Director can edit sub-areas.');
        }

        $data = $request->validate([
            'name'         => 'required|string|max:200',
            'order_number' => 'nullable|integer|min:0',
        ]);

        $subArea->update($data);

        return back()->with('success', 'Sub-area updated.');
    }

    public function archive(SubArea $subArea, Request $request)
    {
        if (!$request->user()->hasRole('director')) {
            return back()->with('error', 'Only the Director can archive sub-areas.');
        }

        $subArea->update(['is_archived' => true]);

        return back()->with('success', "\"{$subArea->name}\" archived.");
    }
}
