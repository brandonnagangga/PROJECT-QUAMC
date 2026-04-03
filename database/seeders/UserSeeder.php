<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole       = Role::where('slug', 'admin')->first();
        $directorRole    = Role::where('slug', 'director')->first();
        $deanRole        = Role::where('slug', 'dean')->first();
        $programCoordRole = Role::where('slug', 'program-coordinator')->first();
        $areaCoordRole   = Role::where('slug', 'area-coordinator')->first();

        // All scoped roles belong to BSIT for demo purposes
        $bsit = Program::where('code', 'BSIT')->first();

        // System Admin
        $admin = User::create([
            'name'     => 'System Administrator',
            'email'    => 'admin@quamc.edu',
            'password' => 'password',
        ]);
        $admin->roles()->attach($adminRole);

        // QUAMC Director
        $director = User::create([
            'name'     => 'Dr. R. Reyes',
            'email'    => 'director@quamc.edu',
            'password' => 'password',
        ]);
        $director->roles()->attach($directorRole);

        // BSIT Dean — Gabriel
        $dean = User::create([
            'name'       => 'Gabriel',
            'email'      => 'gabriel@quamc.edu',
            'password'   => 'password',
            'program_id' => $bsit?->id,
        ]);
        $dean->roles()->attach($deanRole);

        // BSIT Program Coordinator — Jan James
        $programCoord = User::create([
            'name'       => 'Jan James',
            'email'      => 'janjames@quamc.edu',
            'password'   => 'password',
            'program_id' => $bsit?->id,
        ]);
        $programCoord->roles()->attach($programCoordRole);

        // Area Coordinator — J. Santos (BSIT, Area 3)
        $areaCoord = User::create([
            'name'       => 'J. Santos',
            'email'      => 'jsantos@quamc.edu',
            'password'   => 'password',
            'program_id' => $bsit?->id,
        ]);
        $areaCoord->roles()->attach($areaCoordRole);

        // Additional Area Coordinator
        $areaCoord2 = User::create([
            'name'       => 'M. dela Rosa',
            'email'      => 'mdelarosa@quamc.edu',
            'password'   => 'password',
            'program_id' => $bsit?->id,
        ]);
        $areaCoord2->roles()->attach($areaCoordRole);
    }
}
