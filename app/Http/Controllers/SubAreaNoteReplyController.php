<?php

namespace App\Http\Controllers;

use App\Models\SubArea;
use App\Models\SubAreaNoteReply;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class SubAreaNoteReplyController extends Controller
{
    /**
     * Area Coordinator or Dean posts a reply on a sub-area return note.
     */
    public function store(Request $request, SubArea $subArea)
    {
        $request->validate(['message' => 'required|string|max:2000']);

        $user      = $request->user();
        $programId = $user->program_id;

        if (!$programId) {
            return back()->with('error', 'You are not assigned to a program.');
        }

        if (!$user->hasRole(['area-coordinator', 'program-coordinator', 'dean'])) {
            return back()->with('error', 'Not authorized.');
        }

        $reply = SubAreaNoteReply::create([
            'sub_area_id' => $subArea->id,
            'program_id'  => $programId,
            'user_id'     => $user->id,
            'message'     => $request->message,
        ]);

        $areaName = $subArea->area?->name ?? 'an area';

        // If coordinator replied → notify dean(s) of that program
        if ($user->hasRole(['area-coordinator', 'program-coordinator'])) {
            NotificationService::notifyRole(
                'dean',
                'note.replied',
                "{$user->name} replied to a return note for \"{$areaName}\" ({$subArea->name}).",
                $programId,
                $subArea->area_id,
                "/sub-areas/{$subArea->id}/items"
            );
        }

        // If dean replied → notify coordinators of that program
        if ($user->hasRole('dean')) {
            NotificationService::notifyRole(
                'area-coordinator',
                'note.replied',
                "Dean {$user->name} replied to the return note for \"{$areaName}\" ({$subArea->name}).",
                $programId,
                $subArea->area_id,
                "/sub-areas/{$subArea->id}/items"
            );
            NotificationService::notifyRole(
                'program-coordinator',
                'note.replied',
                "Dean {$user->name} replied to the return note for \"{$areaName}\" ({$subArea->name}).",
                $programId,
                $subArea->area_id,
                "/sub-areas/{$subArea->id}/items"
            );
        }

        // Log
        ActivityLogService::log($user, 'area.note_replied', $subArea, [
            'area_name'     => $areaName,
            'sub_area_name' => $subArea->name,
        ], $request->ip());

        return back()->with('success', 'Reply posted.');
    }
}
