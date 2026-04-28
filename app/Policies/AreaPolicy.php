<?php

namespace App\Policies;

use App\Models\Area;
use App\Models\User;

class AreaPolicy
{
    /**
     * Determine if the user can view any areas.
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view areas
    }

    /**
     * Determine if the user can view the area.
     */
    public function view(User $user, Area $area): bool
    {
        return true;
    }

    /**
     * Determine if the user can create areas.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can update the area.
     */
    public function update(User $user, Area $area): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can delete/archive the area.
     */
    public function delete(User $user, Area $area): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can manage area structure.
     */
    public function manage(User $user): bool
    {
        return $user->hasRole('director');
    }
}
