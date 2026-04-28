<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

class ProgramPolicy
{
    /**
     * Determine if the user can view any programs.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can view the program.
     */
    public function view(User $user, Program $program): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        
        // Dean can only view their own program
        if ($role === 'dean') {
            return $user->program_id === $program->id;
        }

        return true; // Others can view all programs
    }

    /**
     * Determine if the user can create programs.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can update the program.
     */
    public function update(User $user, Program $program): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can delete the program.
     */
    public function delete(User $user, Program $program): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can add users to the program.
     */
    public function addUser(User $user, Program $program): bool
    {
        return $user->hasRole('admin');
    }
}
