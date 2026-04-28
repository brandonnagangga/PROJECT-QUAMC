<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\AreaNote;
use App\Models\AreaNoteReply;
use App\Models\AccreditationCycle;
use Illuminate\Http\Request;

class AreaNoteController extends Controller
{
    /**
     * Dean creates a general note for an area.
     * Coordinators and Dean can both view; only Dean can create.
     */
    public function store(Request $request, Area $area)
    {
        $request->validate([
            'content'    => 'required|string|max:2000',
            'program_id' => 'required|exists:programs,id',
        ]);

        $user = $request->user();
        if (!$user->hasRole('dean')) {
            return back()->with('error', 'Only the Dean can create area notes.');
        }

        AreaNote::create([
            'area_id'    => $area->id,
            'program_id' => $request->program_id,
            'user_id'    => $user->id,
            'type'       => 'general',
            'content'    => $request->content,
        ]);

        return back()->with('success', 'Note added.');
    }

    /**
     * Dean or Coordinator replies to an area note.
     */
    public function storeReply(Request $request, AreaNote $note)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        $allowedRoles = ['dean', 'area-coordinator', 'program-coordinator'];
        if (!$user->hasRole($allowedRoles)) {
            return back()->with('error', 'Not authorized to reply to notes.');
        }

        AreaNoteReply::create([
            'area_note_id' => $note->id,
            'user_id'      => $user->id,
            'message'      => $request->message,
        ]);

        return back()->with('success', 'Reply posted.');
    }
}
