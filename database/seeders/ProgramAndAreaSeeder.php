<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Area;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProgramAndAreaSeeder extends Seeder
{
    /**
     * Areas are GLOBAL — shared across all programs in TCC.
     * No program_id on areas. Sub-areas have 3 fixed doc slots (input/process/outcome)
     * as enum on the documents table — nothing to seed for slots themselves.
     */
    public function run(): void
    {
        /* ── 1. Programs ── */
        $programs = [
            ['name' => 'Bachelor of Science in Information Technology',  'code' => 'BSIT'],
            ['name' => 'Bachelor of Science in Business Administration',  'code' => 'BSBA'],
            ['name' => 'Bachelor of Science in Nursing',                 'code' => 'BSN'],
            ['name' => 'Bachelor of Secondary Education',                'code' => 'BSED'],
        ];

        foreach ($programs as $p) {
            Program::create($p);
        }

        /* ── 2. Global Areas (no program_id) ── */
        // Use the director user's ID for created_by; fall back to the first user
        $director = User::whereHas('roles', fn($q) => $q->where('slug', 'director'))->first()
                 ?? User::first();
        $createdBy = $director?->id;

        $areaDefinitions = [
            ['name' => 'Area 1 – Vision, Mission, Goals and Objectives', 'order_number' => 1],
            ['name' => 'Area 2 – Faculty',                               'order_number' => 2],
            ['name' => 'Area 3 – Curriculum',                            'order_number' => 3],
            ['name' => 'Area 4 – Students',                              'order_number' => 4],
            ['name' => 'Area 5 – Research',                              'order_number' => 5],
            ['name' => 'Area 6 – Extension and Community Involvement',   'order_number' => 6],
            ['name' => 'Area 7 – Library',                               'order_number' => 7],
            ['name' => 'Area 8 – Physical Facilities and Equipment',      'order_number' => 8],
            ['name' => 'Area 9 – Administration',                        'order_number' => 9],
            ['name' => 'Area 10 – Quality Assurance',                    'order_number' => 10],
        ];

        /* ── 3. Sub-areas per area ── */
        $subAreaMap = [
            1  => ['1.1 Vision and Mission Statement', '1.2 Goals and Objectives', '1.3 Dissemination and Review'],
            2  => ['2.1 Faculty Qualifications', '2.2 Faculty Development', '2.3 Faculty Workload'],
            3  => ['3.1 Course Offerings', '3.2 Syllabus Quality', '3.3 CMO Compliance'],
            4  => ['4.1 Student Admission', '4.2 Student Services', '4.3 Student Organizations'],
            5  => ['5.1 Research Output', '5.2 Research Funding', '5.3 Research Dissemination'],
            6  => ['6.1 Extension Programs', '6.2 Community Partnerships', '6.3 Extension Impact'],
            7  => ['7.1 Library Resources', '7.2 Library Services', '7.3 Digital Collections'],
            8  => ['8.1 Classroom Facilities', '8.2 Laboratory Equipment', '8.3 Safety and Maintenance'],
            9  => ['9.1 Organizational Structure', '9.2 Administrative Policies', '9.3 Financial Management'],
            10 => ['10.1 Quality Assurance Systems', '10.2 Self-Assessment Reports', '10.3 Improvement Plans'],
        ];

        foreach ($areaDefinitions as $areaDef) {
            $area = Area::create([
                'name'         => $areaDef['name'],
                'order_number' => $areaDef['order_number'],
                'created_by'   => $createdBy,
            ]);

            foreach ($subAreaMap[$areaDef['order_number']] as $idx => $subName) {
                SubArea::create([
                    'area_id'           => $area->id,
                    'name'              => $subName,
                    'order_number'      => $idx + 1,
                    'submission_status' => 'draft',
                    'created_by'        => $createdBy,
                ]);
            }
        }
    }
}
