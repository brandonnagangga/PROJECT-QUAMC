<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'System Admin', 'slug' => 'admin'],
            ['name' => 'QUAMC Director', 'slug' => 'director'],
            ['name' => 'Dean / Office Head', 'slug' => 'dean'],
            ['name' => 'Program Area Coordinator', 'slug' => 'program-coordinator'],
            ['name' => 'Area Coordinator', 'slug' => 'area-coordinator'],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
