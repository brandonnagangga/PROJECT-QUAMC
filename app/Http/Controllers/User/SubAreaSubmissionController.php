<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ReturnSubAreaRequest;
use App\Http\Requests\User\StoreSubAreaRequest;
use App\Http\Requests\User\UpdateSubAreaRequest;
use App\Models\SubArea;
use App\Models\SubAreaNote;
use App\Services\AreaService;
use Illuminate\Http\Request;

class SubAreaSubmissionController extends Controller
{
    public function __construct(
        protected AreaService $areaService
    ) {}
    /**
     * Coordinator submits a sub-area to the Dean.
     */
    public function submit(SubArea $subArea, Request $request)
    {
        $this->authorize('submit', $subArea);

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
        $this->authorize('forward', $subArea);

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
        $this->authorize('approve', $subArea);

        if ($subArea->submission_status !== 'submitted_to_director') {
            return back()->with('error', 'Sub-area must be submitted to Director first.');
        }

        $subArea->update(['submission_status' => 'approved']);

        return back()->with('success', "\"{$subArea->name}\" approved! ✓");
    }

    /**
     * Dean or Director returns a sub-area for revision.
     */
    public function returnSubArea(SubArea $subArea, ReturnSubAreaRequest $request)
    {
        $this->authorize('return', $subArea);

        $user = $request->user();
        $isDean = $user->hasRole('dean');
        $isDirector = $user->hasRole('director');

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

    public function store(StoreSubAreaRequest $request)
    {
        $this->authorize('create', SubArea::class);

        $subArea = $this->areaService->createSubArea($request->validated(), $request->user());

        return back()->with('success', "Sub-area \"{$subArea->name}\" created.");
    }

    public function update(SubArea $subArea, UpdateSubAreaRequest $request)
    {
        $this->authorize('update', $subArea);

        $this->areaService->updateSubArea($subArea, $request->validated());

        return back()->with('success', 'Sub-area updated.');
    }

    public function archive(SubArea $subArea, Request $request)
    {
        $this->authorize('delete', $subArea);

        $this->areaService->archiveSubArea($subArea);

        return back()->with('success', "\"{$subArea->name}\" archived.");
    }
}
