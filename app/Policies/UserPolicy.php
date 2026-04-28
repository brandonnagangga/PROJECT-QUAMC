<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine if the user can view any users.
     */
    public function viewAny(User $user): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return in_array($role, ['admin', 'director', 'dean']);
    }

    /**
     * Determine if the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        
        // Dean can only view users in their program
        if ($role === 'dean') {
            return $user->program_id === $model->program_id || $user->id === $model->id;
        }

        return true;
    }

    /**
     * Determine if the user can create users.
     */
    public function create(User $user): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return in_array($role, ['admin', 'director']);
    }

    /**
     * Determine if the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return in_array($role, ['admin', 'director']);
    }

    /**
     * Determine if the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can assign areas.
     */
    public function assignArea(User $user): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return in_array($role, ['admin', 'director', 'dean']);
    }

    /**
     * Determine if the user can assign roles.
     */
    public function assignRole(User $user): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine if the user can view the network graph visualization.
     */
    public function viewNetworkGraph(User $user): bool
    {
        // All authenticated users can view the network graph
        return true;
    }
}
