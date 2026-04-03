<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\AreaChecklist;
use Illuminate\Http\Request;

class ChecklistController extends Controller
{
    public function index(Area $area)
    {
        $items = $area->checklists()->orderBy('order_number')->get()->map(fn ($c) => [
            'id' => $c->id,
            'evidence_type' => $c->evidence_type,
            'description' => $c->description,
            'is_required' => $c->is_required,
            'is_completed' => $c->is_completed,
            'order_number' => $c->order_number,
        ]);

        return response()->json(['checklist' => $items]);
    }

    public function store(Area $area, Request $request)
    {
        $data = $request->validate([
            'evidence_type' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_required' => 'boolean',
        ]);

        $maxOrder = $area->checklists()->max('order_number') ?? 0;

        $area->checklists()->create([
            ...$data,
            'order_number' => $maxOrder + 1,
        ]);

        return redirect()->back()->with('success', 'Checklist item added.');
    }

    public function update(AreaChecklist $checklist, Request $request)
    {
        $data = $request->validate([
            'evidence_type' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_required' => 'sometimes|boolean',
            'is_completed' => 'sometimes|boolean',
        ]);

        $checklist->update($data);

        return redirect()->back()->with('success', 'Checklist item updated.');
    }

    public function toggleComplete(AreaChecklist $checklist)
    {
        $checklist->update(['is_completed' => !$checklist->is_completed]);

        return redirect()->back()->with('success', $checklist->is_completed ? 'Marked as complete.' : 'Marked as incomplete.');
    }

    public function destroy(AreaChecklist $checklist)
    {
        $checklist->delete();

        return redirect()->back()->with('success', 'Checklist item removed.');
    }
}
