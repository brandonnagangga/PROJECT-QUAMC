<?php

namespace App\Services;

use App\Models\Area;
use App\Models\SubArea;
use App\Models\User;

class AreaService
{
    /**
     * Create a new area.
     */
    public function createArea(array $data, User $user): Area
    {
        return Area::create([
            ...$data,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Update an existing area.
     */
    public function updateArea(Area $area, array $data): Area
    {
        $area->update($data);
        return $area->fresh();
    }

    /**
     * Archive an area.
     */
    public function archiveArea(Area $area): Area
    {
        $area->update(['is_archived' => true]);
        return $area->fresh();
    }

    /**
     * Create a new sub-area.
     */
    public function createSubArea(array $data, User $user): SubArea
    {
        return SubArea::create([
            ...$data,
            'created_by' => $user->id,
        ]);
    }

    /**
     * Update an existing sub-area.
     */
    public function updateSubArea(SubArea $subArea, array $data): SubArea
    {
        $subArea->update($data);
        return $subArea->fresh();
    }

    /**
     * Archive a sub-area.
     */
    public function archiveSubArea(SubArea $subArea): SubArea
    {
        $subArea->update(['is_archived' => true]);
        return $subArea->fresh();
    }

    /**
     * Get areas with sub-areas for management.
     */
    public function getAreasForManagement(): \Illuminate\Database\Eloquent\Collection
    {
        return Area::where('is_archived', false)
            ->with(['subAreas' => fn($q) => $q->where('is_archived', false)->orderBy('order_number')])
            ->orderBy('order_number')
            ->get();
    }
}
