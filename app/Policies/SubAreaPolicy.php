<?php

namespace App\Policies;

use App\Models\SubArea;
use App\Models\User;

class SubAreaPolicy
{
    /**
     * Determine if the user can view any sub-areas.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can view the sub-area.
     */
    public function view(User $user, SubArea $subArea): bool
    {
        return true;
    }

    /**
     * Determine if the user can create sub-areas.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can update the sub-area.
     */
    public function update(User $user, SubArea $subArea): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can delete/archive the sub-area.
     */
    public function delete(User $user, SubArea $subArea): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can submit the sub-area.
     */
    public function submit(User $user, SubArea $subArea): bool
    {
        return $user->hasRole(['area-coordinator', 'program-coordinator']);
    }

    /**
     * Determine if the user can forward to director (Dean only).
     */
    public function forward(User $user, SubArea $subArea): bool
    {
        return $user->hasRole('dean');
    }

    /**
     * Determine if the user can approve as director.
     */
    public function approve(User $user, SubArea $subArea): bool
    {
        return $user->hasRole('director');
    }

    /**
     * Determine if the user can return the sub-area.
     */
    public function return(User $user, SubArea $subArea): bool
    {
        return $user->hasRole(['dean', 'director']);
    }
}
