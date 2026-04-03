<?php

namespace App\Http\Controllers;

use App\Models\SubArea;
use Illuminate\Http\Request;

class SubAreaSubmissionController extends Controller
{
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
        $request->validate(['comment' => 'nullable|string|max:500']);
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

        return back()->with('success', "\"{$subArea->name}\" returned for revision.");
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
