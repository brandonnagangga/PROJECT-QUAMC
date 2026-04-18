<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine if the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can view documents
    }

    /**
     * Determine if the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        return true; // All authenticated users can view documents
    }

    /**
     * Determine if the user can create documents.
     */
    public function create(User $user): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return in_array($role, ['dean', 'area-coordinator', 'program-coordinator']);
    }

    /**
     * Determine if the user can upload to a specific program and area.
     */
    public function upload(User $user, int $programId, int $areaId): bool
    {
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            return false;
        }

        // Must be in the same program
        if ($user->program_id != $programId) {
            return false;
        }

        // Area coordinators can only upload to their assigned areas
        if ($role === 'area-coordinator') {
            return $user->areaAssignments()->where('area_id', $areaId)->exists();
        }

        return true; // Dean and program-coordinator can upload to any area in their program
    }

    /**
     * Determine if the user can update the document.
     */
    public function update(User $user, Document $document): bool
    {
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            return false;
        }

        // Must be in the same program
        if ($user->program_id != $document->program_id) {
            return false;
        }

        // Area coordinators can only update documents in their assigned areas
        if ($role === 'area-coordinator') {
            $areaId = $document->subArea->area_id;
            return $user->areaAssignments()->where('area_id', $areaId)->exists();
        }

        return true;
    }

    /**
     * Determine if the user can approve the document.
     */
    public function approve(User $user, Document $document): bool
    {
        $role = $user->roles->first()?->slug ?? '';

        if ($role !== 'dean') {
            return false;
        }

        return $user->program_id === $document->program_id;
    }

    /**
     * Determine if the user can reject the document.
     */
    public function reject(User $user, Document $document): bool
    {
        return $this->approve($user, $document);
    }

    /**
     * Determine if the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        $role = $user->roles->first()?->slug ?? '';
        return $role === 'director' || $role === 'admin';
    }

    /**
     * Determine if the user can download the document.
     */
    public function download(User $user, Document $document): bool
    {
        return true; // All authenticated users can download
    }
}
