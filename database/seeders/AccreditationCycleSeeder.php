<?php

namespace Database\Seeders;

use App\Models\AccreditationCycle;
use Illuminate\Database\Seeder;

class AccreditationCycleSeeder extends Seeder
{
    public function run(): void
    {
        AccreditationCycle::create([
            'name'          => 'A.Y. 2024-2025 Accreditation Cycle',
            'academic_year' => '2024-2025',
            'is_active'     => true,
            'start_date'    => '2024-08-01',
            'end_date'      => '2027-12-31',  // far future so it never locks during dev
        ]);
    }
}
