<?php

namespace App\Console\Commands;

use App\Models\Area;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Console\Command;

class CheckOverdueDeadlines extends Command
{
    protected $signature = 'deadlines:check';
    protected $description = 'Check for areas with passed deadlines and notify relevant users';

    public function handle(): void
    {
        $overdueAreas = Area::whereNotNull('deadline_at')
            ->where('deadline_at', '<', now())
            ->with(['program'])
            ->get();

        if ($overdueAreas->isEmpty()) {
            $this->info('No overdue areas found.');
            return;
        }

        // Notify admin, director, and dean users
        $notifyRoles = ['admin', 'director', 'dean'];
        $usersToNotify = User::whereHas('roles', fn ($q) => $q->whereIn('slug', $notifyRoles))->get();

        foreach ($overdueAreas as $area) {
            $message = "Area \"{$area->name}\" in {$area->program->code} has passed its deadline ("
                . $area->deadline_at->format('M j, Y') . ").";

            foreach ($usersToNotify as $user) {
                // Avoid duplicate notifications for the same area on the same day
                $exists = Notification::where('user_id', $user->id)
                    ->where('type', 'deadline_overdue')
                    ->where('data->area_id', $area->id)
                    ->whereDate('created_at', today())
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'user_id' => $user->id,
                        'type' => 'deadline_overdue',
                        'data' => [
                            'area_id' => $area->id,
                            'area_name' => $area->name,
                            'program_code' => $area->program->code,
                            'deadline' => $area->deadline_at->format('Y-m-d'),
                            'message' => $message,
                        ],
                    ]);
                }
            }

            $this->warn("Overdue: {$area->name} ({$area->program->code})");
        }

        $this->info("Checked {$overdueAreas->count()} overdue area(s).");
    }
}
