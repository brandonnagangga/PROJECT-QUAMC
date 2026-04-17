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
            ['name' => 'Area 1: Governance and Administration', 'order_number' => 1],
            ['name' => 'Area 2: Faculty',                       'order_number' => 2],
            ['name' => 'Area 3: Curriculum and Instruction',    'order_number' => 3],
            ['name' => 'Area 4: Student Development and Services', 'order_number' => 4],
            ['name' => 'Area 5: Entrepreneurship and Employability', 'order_number' => 5],
            ['name' => 'Area 6: Community Extension Services',  'order_number' => 6],
            ['name' => 'Area 7: Research',                      'order_number' => 7],
            ['name' => 'Area 8: Library',                       'order_number' => 8],
            ['name' => 'Area 9: Laboratories',                  'order_number' => 9],
            ['name' => 'Area 10: Physical Plant',               'order_number' => 10],
        ];

        /* ── 3. Sub-areas per area ── */
        $subAreaMap = [
            1  => [
                'Sub Area 1: Administrative Organization',
                'Sub Area 2: Academic Administration',
                'Sub Area 3: Administration of Non-Academic Personnel',
                'Sub Area 4: Financial Management',
                'Sub Area 5: Supply Management',
                'Sub Area 6: Records Management',
                'Sub Area 7: Institutional Planning and Development',
                'Sub Area 8: Linkages and Networking',
            ],
            2  => [
                'Sub Area 1: Academic Qualifications and Teaching Experiences',
                'Sub Area 2: Recruitment and Selection',
                'Sub Area 3: Ranking and Promotion',
                'Sub Area 4: Faculty Loading',
                'Sub Area 5: Professional Performance and Scholarly Work',
                'Sub Area 6: Performance Evaluation',
                'Sub Area 7: Faculty Development Program',
                'Sub Area 8: Faculty Relationships',
                'Sub Area 9: Salaries and Benefits',
            ],
            3  => [
                'Sub Area 1: Program of Studies',
                'Sub Area 2: Instructional Procedures',
                'Sub Area 3: Classroom Management',
                'Sub Area 4: Assessment of Academic Performance',
                'Sub Area 5: Support for Effective Instruction',
                'Sub Area 6: Academic Counseling and Co-Curricular Activities',
                'Sub Area 7: Mechanism for Monitoring and Review of Curriculum',
                'Sub Area 8: Graduation Requirement',
            ],
            4  => [
                'Sub Area 1: Administration and Supervision',
                'Sub Area 2: Admission',
                'Sub Area 3: Guidance Program and Services',
                'Sub Area 4: Student Organizations and Activities',
                'Sub Area 5: Student Development Program',
                'Sub Area 6: Student Assistance Program',
                'Sub Area 7: Specialized Student Services',
                'Sub Area 8: Alumni Relations',
            ],
            5  => [
                'Sub Area 1: Involvement of Industry in Curriculum Development and Planning',
                'Sub Area 2: Involvement of Practitioners in Teaching Process',
                'Sub Area 3: On-the-Job Training',
                'Sub Area 4: Resource Sharing Between School and Industry',
                'Sub Area 5: LCU-LGU Industry Partnership for Job Placement and Employment',
                'Sub Area 6: Continuous Search for Industry Partners',
                'Sub Area 7: Entrepreneurship',
            ],
            6  => [
                'Sub Area 1: Community Extension Services',
            ],
            7  => [
                'Sub Area 1: Priorities and Relevance',
                'Sub Area 2: Funding, Instructional Support and Other Resources',
                'Sub Area 3: Quality of Research Outputs',
                'Sub Area 4: Publication, Dissemination and Utilization',
                'Sub Area 5: LCU Research Partner of Local Government Unit',
            ],
            8  => [
                'Sub Area 1: Administration and Personnel',
                'Sub Area 2: Collections',
                'Sub Area 3: Budget',
                'Sub Area 4: Services and Use',
                'Sub Area 5: Physical Set-Up',
                'Sub Area 6: Technology',
            ],
            9  => [
                'Sub Area 1: Lecture Rooms',
                'Sub Area 2: Laboratory Rooms',
                'Sub Area 3: Specific Laboratory Requirements',
                'Sub Area 4: Safety',
                'Sub Area 5: Equipment and Supplies',
                'Sub Area 6: Maintenance and Improvement',
                'Sub Area 7: Special Provisions',
            ],
            10 => [
                'Sub Area 1: Site',
                'Sub Area 2: Campus',
                'Sub Area 3: Buildings',
                'Sub Area 4: Classrooms',
                'Sub Area 5: Offices and Staff Rooms / Function Rooms',
                'Sub Area 6: Auditorium',
                'Sub Area 7: Athletic Facilities',
                'Sub Area 8: Medical/Dental Clinic',
                'Sub Area 9: Food Services Area',
                'Sub Area 10: Student Center',
            ],
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
