<?php

namespace App\Services;

use App\Models\AreaAssignment;
use App\Models\User;
use App\Traits\LogsActivity;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    use LogsActivity;
    /**
     * Create a new user.
     */
    public function createUser(array $data): User
    {
        $activationMode = $data['activation_mode'] ?? 'activate_now';
        $notifyUser = (bool) ($data['notify_user'] ?? false);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => $activationMode === 'activate_now',
            'program_id' => $data['program_id'] ?? null,
        ]);

        $user->roles()->attach($data['role_id']);

        // Log sensitive action
        $this->logSensitiveAction('user_created', $user, [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'role_id' => $data['role_id'],
            'program_id' => $data['program_id'] ?? null,
            'activation_mode' => $activationMode,
            'notify_user' => $notifyUser,
        ]);

        return $user->fresh('roles');
    }

    /**
     * Update an existing user.
     */
    public function updateUser(User $user, array $data): User
    {
        $changes = [];
        
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
            $changes['password_changed'] = true;
        }
        
        if (isset($data['email']) && $data['email'] !== $user->email) {
            $changes['old_email'] = $user->email;
            $changes['new_email'] = $data['email'];
        }

        $user->update($data);
        
        // Log sensitive action if there were changes
        if (!empty($changes)) {
            $this->logSensitiveAction('user_updated', $user, $changes);
        }
        
        return $user->fresh();
    }

    /**
     * Toggle user active status.
     */
    public function toggleUserStatus(User $user): User
    {
        $newStatus = !$user->is_active;
        $user->update(['is_active' => $newStatus]);
        
        // Log sensitive action
        $this->logSensitiveAction('user_status_changed', $user, [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'new_status' => $newStatus ? 'active' : 'inactive',
        ]);
        
        return $user->fresh();
    }

    /**
     * Assign areas to a user.
     */
    public function assignAreas(User $user, array $areaIds, string $roleType, string $academicYear, User $assignedBy): int
    {
        $created = 0;
        $assignedAreas = [];

        foreach ($areaIds as $areaId) {
            $exists = AreaAssignment::where('user_id', $user->id)
                ->where('area_id', $areaId)
                ->where('academic_year', $academicYear)
                ->exists();

            if (!$exists) {
                AreaAssignment::create([
                    'user_id' => $user->id,
                    'area_id' => $areaId,
                    'assigned_by' => $assignedBy->id,
                    'role_type' => $roleType,
                    'academic_year' => $academicYear,
                ]);
                $created++;
                $assignedAreas[] = $areaId;
            }
        }

        // Log sensitive action if areas were assigned
        if ($created > 0) {
            $this->logSensitiveAction('areas_assigned', $user, [
                'user_name' => $user->name,
                'user_email' => $user->email,
                'area_ids' => $assignedAreas,
                'role_type' => $roleType,
                'academic_year' => $academicYear,
                'assigned_by' => $assignedBy->name,
            ]);
        }

        return $created;
    }

    /**
     * Remove an area assignment.
     */
    public function removeAreaAssignment(int $areaId, string $userId): bool
    {
        $deleted = AreaAssignment::where('area_id', $areaId)
            ->where('user_id', $userId)
            ->delete() > 0;
            
        // Log sensitive action if assignment was removed
        if ($deleted) {
            $user = User::find($userId);
            $this->logSensitiveAction('area_assignment_removed', $user, [
                'user_id' => $userId,
                'area_id' => $areaId,
            ]);
        }
        
        return $deleted;
    }

    /**
     * Assign a role to a user.
     */
    public function assignRole(User $user, int $roleId): User
    {
        $user->roles()->sync([$roleId]);
        
        // Log sensitive action
        $this->logSensitiveAction('role_assigned', $user, [
            'user_name' => $user->name,
            'user_email' => $user->email,
            'role_id' => $roleId,
        ]);
        
        return $user->fresh('roles');
    }
}
