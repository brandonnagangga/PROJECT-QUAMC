<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\SubArea;
use App\Models\SubAreaNote;
use Illuminate\Http\Request;

class SubAreaSubmissionController extends Controller
{
    /**
     * Coordinator submits ALL eligible sub-areas in an area to the Dean at once.
     */
    public function submitArea(Area $area, Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['area-coordinator', 'program-coordinator'])) {
            return back()->with('error', 'Only coordinators can submit sub-areas.');
        }

        $submittable = ['draft', 'returned', 'returned_by_dean'];
        $count = 0;

        foreach ($area->subAreas()->where('is_archived', false)->get() as $subArea) {
            if (in_array($subArea->submission_status, $submittable)) {
                $subArea->update(['submission_status' => 'submitted_to_dean']);
                $count++;
            }
        }

        if ($count === 0) {
            return back()->with('error', 'No sub-areas are ready to submit (all are already submitted or approved).');
        }

        return back()->with('success', "{$count} sub-area(s) in \"{$area->name}\" submitted to Dean.");
    }

    /**
     * Coordinator submits a sub-area to the Dean.
     */
    public function submit(SubArea $subArea, Request $request)

    {
        $user = $request->user();
        if (!$user->hasRole(['area-coordinator', 'program-coordinator'])) {
            return back()->with('error', 'Only coordinators can submit sub-areas.');
        }

        if (!in_array($subArea->submission_status, ['draft', 'returned', 'returned_by_dean'])) {
            return back()->with('error', 'This sub-area cannot be submitted in its current state.');
        }

        $subArea->update(['submission_status' => 'submitted_to_dean']);

        return back()->with('success', "\"{$subArea->name}\" submitted to Dean for review.");
    }

    /**
     * Dean approves and forwards a sub-area to the Director.
     */
    public function forwardToDirector(SubArea $subArea, Request $request)
    {
        if (!$request->user()->hasRole('dean')) {
            return back()->with('error', 'Only Deans can forward sub-areas.');
        }

        if ($subArea->submission_status !== 'submitted_to_dean') {
            return back()->with('error', 'Sub-area must be submitted to Dean first.');
        }

        $subArea->update([
            'submission_status'    => 'submitted_to_director',
            'submitted_by_dean_at' => now(),
        ]);

        return back()->with('success', "\"{$subArea->name}\" forwarded to QUAMC Director.");
    }

    /**
     * Director gives final approval.
     */
    public function approveDirector(SubArea $subArea, Request $request)
    {
        if (!$request->user()->hasRole('director')) {
            return back()->with('error', 'Only the Director can give final approval.');
        }

        if ($subArea->submission_status !== 'submitted_to_director') {
            return back()->with('error', 'Sub-area must be submitted to Director first.');
        }

        $subArea->update(['submission_status' => 'approved']);

        return back()->with('success', "\"{$subArea->name}\" approved! ✓");
    }

    /**
     * Dean or Director returns a sub-area for revision.
     */
    public function returnSubArea(SubArea $subArea, Request $request)
    {
        $request->validate([
            'comment'    => 'nullable|string|max:1000',
            'program_id' => 'nullable|exists:programs,id',
        ]);
        $user = $request->user();

        $isDean     = $user->hasRole('dean');
        $isDirector = $user->hasRole('director');

        if (!$isDean && !$isDirector) {
            return back()->with('error', 'Not authorized to return sub-areas.');
        }

        if ($isDean && $subArea->submission_status !== 'submitted_to_dean') {
            return back()->with('error', 'Sub-area is not awaiting Dean review.');
        }

        if ($isDirector && $subArea->submission_status !== 'submitted_to_director') {
            return back()->with('error', 'Sub-area is not awaiting Director review.');
        }

        $newStatus = $isDean ? 'returned_by_dean' : 'returned';
        $subArea->update(['submission_status' => $newStatus]);

        // Save return note per program when a comment is provided
        $programId = $request->program_id ?? $user->program_id;
        if (!empty($request->comment) && $programId) {
            SubAreaNote::updateOrCreate(
                ['sub_area_id' => $subArea->id, 'program_id' => $programId],
                ['notes' => $request->comment, 'updated_by' => $user->id]
            );
        }

        return back()->with('success', "\"{$subArea->name}\" returned for revision.");
    }

    /**
     * Dean: update or clear the return note for a specific program's sub-area.
     */
    public function updateNote(SubArea $subArea, Request $request)
    {
        $request->validate([
            'notes'      => 'nullable|string|max:1000',
            'program_id' => 'required|exists:programs,id',
        ]);

        $user = $request->user();
        if (!$user->hasRole('dean')) {
            return back()->with('error', 'Only Deans can update return notes.');
        }

        if (empty($request->notes)) {
            SubAreaNote::where('sub_area_id', $subArea->id)
                ->where('program_id', $request->program_id)
                ->delete();
        } else {
            SubAreaNote::updateOrCreate(
                ['sub_area_id' => $subArea->id, 'program_id' => $request->program_id],
                ['notes' => $request->notes, 'updated_by' => $user->id]
            );
        }

        return back()->with('success', 'Return note updated.');
    }

    /* ── Director-only Sub-area CRUD ── */

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
