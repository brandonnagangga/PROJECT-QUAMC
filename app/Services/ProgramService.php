<?php

namespace App\Services;

use App\Models\Program;
use App\Models\User;

class ProgramService
{
    /**
     * Create a new program.
     */
    public function createProgram(array $data): Program
    {
        return Program::create([
            ...$data,
            'is_active' => true,
        ]);
    }

    /**
     * Assign a user to a program.
     */
    public function assignUserToProgram(User $user, Program $program): User
    {
        $user->update(['program_id' => $program->id]);
        return $user->fresh();
    }

    /**
     * Get program statistics including area completion.
     */
    public function getProgramStatistics(Program $program, $areas): array
    {
        $allSubAreaIds = $areas->flatMap(fn($a) => $a->subAreas->pluck('id'));
        $totalSlots = $allSubAreaIds->count() * 3;

        $docs = \App\Models\Document::whereIn('sub_area_id', $allSubAreaIds)
            ->where('program_id', $program->id)
            ->get();

        $approved = $docs->where('status', 'approved')->count();
        $pending = $docs->where('status', 'pending_review')->count();
        $returned = $docs->where('status', 'returned')->count();
        $pct = $totalSlots > 0 ? round(($approved / $totalSlots) * 100) : 0;

        return [
            'totalSlots' => $totalSlots,
            'approved' => $approved,
            'pending' => $pending,
            'returned' => $returned,
            'percentage' => $pct,
        ];
    }

    /**
     * Get area breakdown for a program.
     */
    public function getAreaBreakdown(Program $program, $areas): array
    {
        return $areas->map(function ($area) use ($program) {
            $subAreaIds = $area->subAreas->pluck('id');
            $totalSlots = $subAreaIds->count() * 3;
            $approvedSlots = $totalSlots > 0
                ? \App\Models\Document::whereIn('sub_area_id', $subAreaIds)
                    ->where('program_id', $program->id)
                    ->where('status', 'approved')
                    ->count()
                : 0;

            return [
                'id' => $area->id,
                'name' => $area->name,
                'order_number' => $area->order_number,
                'pct' => $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0,
            ];
        })->values()->toArray();
    }
}
