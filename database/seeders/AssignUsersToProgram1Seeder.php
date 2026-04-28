<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Assigns all Dean / Program-Coordinator / Area-Coordinator accounts
 * to program_id = 1 for local testing.
 *
 * Run with: php artisan db:seed --class=AssignUsersToProgram1Seeder
 */
class AssignUsersToProgram1Seeder extends Seeder
{
    public function run(): void
    {
        $roles = ['dean', 'program-coordinator', 'area-coordinator'];

        $updated = User::whereHas('roles', function ($q) use ($roles) {
            $q->whereIn('slug', $roles);
        })->update(['program_id' => 1]);

        $this->command->info("Updated {$updated} user(s) → program_id = 1");
    }
}
