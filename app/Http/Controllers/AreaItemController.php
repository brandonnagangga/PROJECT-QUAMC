<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\AreaItem;
use App\Models\SubArea;
use Illuminate\Http\Request;

class AreaItemController extends Controller
{
    /**
     * Create a new item or sub-item. Director / Admin only.
     */
    public function store(Request $request)
    {
        $this->authorizeDirector($request);

        $validated = $request->validate([
            'sub_area_id'    => 'required|exists:sub_areas,id',
            'ipo_type'       => 'required|in:input,process,outcome',
            'parent_item_id' => 'nullable|exists:area_items,id',
            'label'          => 'required|string|max:255',
        ]);

        // Auto order: put it after the last sibling
        $maxOrder = AreaItem::where('sub_area_id', $validated['sub_area_id'])
            ->where('ipo_type', $validated['ipo_type'])
            ->where('parent_item_id', $validated['parent_item_id'] ?? null)
            ->max('order_number') ?? 0;

        $item = AreaItem::create([
            ...$validated,
            'order_number' => $maxOrder + 1,
        ]);

        return back()->with('success', "Item \"{$item->label}\" created.");
    }

    /**
     * Update label or order. Director / Admin only.
     */
    public function update(Request $request, AreaItem $item)
    {
        $this->authorizeDirector($request);

        $validated = $request->validate([
            'label'        => 'sometimes|string|max:255',
            'order_number' => 'sometimes|integer|min:0',
        ]);

        $item->update($validated);
        return back()->with('success', 'Item updated.');
    }

    /**
     * Archive (soft-delete) an item. Director / Admin only.
     */
    public function destroy(Request $request, AreaItem $item)
    {
        $this->authorizeDirector($request);
        $item->update(['is_archived' => true]);
        return back()->with('success', 'Item archived.');
    }

    private function authorizeDirector(Request $request): void
    {
        $role = $request->user()->roles->first()?->slug;
        if (!in_array($role, ['director', 'admin'])) {
            abort(403, 'Only Directors or Admins may manage area items.');
        }
    }
}
