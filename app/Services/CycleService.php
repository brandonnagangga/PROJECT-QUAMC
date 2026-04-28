<?php

namespace App\Services;

use App\Models\AccreditationCycle;

class CycleService
{
    /**
     * Create a new accreditation cycle.
     */
    public function createCycle(array $data): AccreditationCycle
    {
        $cycle = AccreditationCycle::create($data);

        if (!empty($data['is_active'])) {
            $cycle->setAsActive();
        }

        return $cycle->fresh();
    }

    /**
     * Update an existing cycle.
     */
    public function updateCycle(AccreditationCycle $cycle, array $data): AccreditationCycle
    {
        $cycle->update($data);
        return $cycle->fresh();
    }

    /**
     * Activate a cycle (deactivates all others).
     */
    public function activateCycle(AccreditationCycle $cycle): AccreditationCycle
    {
        $cycle->setAsActive();
        return $cycle->fresh();
    }

    /**
     * Delete a cycle if it has no associated documents.
     */
    public function deleteCycle(AccreditationCycle $cycle): bool
    {
        if ($cycle->documents()->count() > 0) {
            return false;
        }

        return $cycle->delete();
    }
}
