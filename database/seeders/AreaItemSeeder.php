<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\AreaItem;
use App\Models\SubArea;
use Illuminate\Database\Seeder;

class AreaItemSeeder extends Seeder
{
    public function run(): void
    {
        // Guard: if items already seeded, skip
        if (AreaItem::count() > 0) {
            $this->command->info('AreaItemSeeder: items already exist, skipping.');
            return;
        }

        foreach ($this->data() as $areaName => $subAreas) {
            $area = Area::where('name', 'like', '%' . $this->areaKeyword($areaName) . '%')->first();
            if (!$area) {
                $this->command->warn("Area not found for: {$areaName}");
                continue;
            }

            foreach ($subAreas as $subAreaName => $ipoData) {
                $subArea = SubArea::where('area_id', $area->id)
                    ->where('name', 'like', '%' . $this->subAreaKeyword($subAreaName) . '%')
                    ->first();
                if (!$subArea) {
                    $this->command->warn("  Sub-area not found: {$subAreaName} in {$areaName}");
                    continue;
                }

                foreach (['input', 'process', 'outcome'] as $ipo) {
                    $items = $ipoData[$ipo] ?? [];
                    $parentOrder = 0;

                    foreach ($items as $label => $subItems) {
                        $parentOrder++;
                        $parent = AreaItem::create([
                            'sub_area_id'    => $subArea->id,
                            'ipo_type'       => $ipo,
                            'parent_item_id' => null,
                            'label'          => is_string($label) ? $label : $subItems,
                            'order_number'   => $parentOrder,
                        ]);

                        if (is_array($subItems)) {
                            $childOrder = 0;
                            foreach ($subItems as $childLabel) {
                                $childOrder++;
                                AreaItem::create([
                                    'sub_area_id'    => $subArea->id,
                                    'ipo_type'       => $ipo,
                                    'parent_item_id' => $parent->id,
                                    'label'          => $childLabel,
                                    'order_number'   => $childOrder,
                                ]);
                            }
                        }
                    }
                }
            }
        }

        $this->command->info('AreaItemSeeder: done — ' . AreaItem::count() . ' items created.');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function areaKeyword(string $name): string
    {
        // e.g. "Area 1: Governance and Administration" → "Governance"
        $parts = explode(':', $name, 2);
        $keyword = trim($parts[1] ?? $parts[0]);
        return explode(' ', $keyword)[0]; // first significant word
    }

    private function subAreaKeyword(string $name): string
    {
        $parts = explode(':', $name, 2);
        $keyword = trim($parts[1] ?? $parts[0]);
        return implode(' ', array_slice(explode(' ', $keyword), 0, 2));
    }

    // ── Items data ─────────────────────────────────────────────────────────
    // Format:
    //   'Item 1' => []                  ← item with no sub-items
    //   'Item 2' => ['Sub-item a', ...]  ← item with sub-items
    // ──────────────────────────────────────────────────────────────────────

    private function data(): array
    {
        return [
            // ════════════════════════════════════════════════════════════════
            // AREA 1: GOVERNANCE AND ADMINISTRATION
            // ════════════════════════════════════════════════════════════════
            'Area 1: Governance and Administration' => [
                'Sub Area 1: Administrative Organization' => [
                    'input' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f'],
                    ],
                    'process' => [
                        'Item 1' => ['Sub-item a','Sub-item b'],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                    ],
                ],
                'Sub Area 2: Academic Administration' => [
                    'input' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e'],
                        'Item 2' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                        'Item 3' => [],
                        'Item 4' => ['Sub-item a','Sub-item b','Sub-item c'],
                    ],
                    'process' => [
                        'Item 1' => [],
                        'Item 2' => ['Sub-item a','Sub-item b','Sub-item c'],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                    ],
                ],
                'Sub Area 3: Administration of Non-Academic Personnel' => [
                    'input' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                        'Item 6' => [],
                        'Item 7' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                        'Item 8' => [],
                        'Item 9' => [],
                    ],
                    'process' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g','Sub-item h','Sub-item i'],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                    ],
                ],
                'Sub Area 4: Financial Management' => [
                    'input' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 2' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g'],
                        'Item 4' => ['Sub-item a','Sub-item b'],
                        'Item 5' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                        'Item 6' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f'],
                    ],
                    'process' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f'],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                        'Item 6' => [],
                    ],
                ],
                'Sub Area 5: Supply Management' => [
                    'input' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                        'Item 6' => [],
                        'Item 7' => [],
                    ],
                    'process' => [
                        'Item 1' => [],
                        'Item 2' => [],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                        'Item 6' => [],
                    ],
                ],
                'Sub Area 6: Records Management' => [
                    'input' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                    ],
                    'process' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g','Sub-item h','Sub-item i','Sub-item j','Sub-item k'],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                    ],
                ],
                'Sub Area 7: Institutional Planning and Development' => [
                    'input' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                    ],
                    'process' => [
                        'Item 1' => [],
                        'Item 2' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 3' => [],
                        'Item 4' => [],
                    ],
                    'outcome' => [
                        'Item 1' => [],
                        'Item 2' => [],
                    ],
                ],
                'Sub Area 8: Linkages and Networking' => [
                    'input' => [
                        'Item 1' => [],
                        'Item 2' => [],
                        'Item 3' => [],
                        'Item 4' => [],
                        'Item 5' => [],
                        'Item 6' => [],
                    ],
                    'process' => [
                        'Item 1' => [],
                    ],
                    'outcome' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2'],
                    ],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 2: FACULTY
            // ════════════════════════════════════════════════════════════════
            'Area 2: Faculty' => [
                'Sub Area 1: Academic Qualifications and Teaching Experiences' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 2: Recruitment and Selection' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 3: Ranking and Promotion' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 4: Faculty Loading' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 5: Professional Performance and Scholarly Work' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 6: Performance Evaluation' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[]],
                ],
                'Sub Area 7: Faculty Development Program' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 8: Faculty Relationships' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 9: Salaries and Benefits' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 3: CURRICULUM AND INSTRUCTION
            // ════════════════════════════════════════════════════════════════
            'Area 3: Curriculum and Instruction' => [
                'Sub Area 1: Program of Studies' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 2: Instructional Procedures' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 3: Classroom Management' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 4: Assessment of Academic Performance' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                ],
                'Sub Area 5: Support for Effective Instruction' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 6: Academic Counseling and Co-Curricular Activities' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 7: Mechanism for Monitoring and Review of Curriculum' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 8: Graduation Requirement' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 4: STUDENT DEVELOPMENT AND SERVICES
            // ════════════════════════════════════════════════════════════════
            'Area 4: Student Development and Services' => [
                'Sub Area 1: Administration and Supervision' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],'Item 12'=>[],'Item 13'=>[],'Item 14'=>[],'Item 15'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 2: Admission' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 3: Guidance Program and Services' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 4: Student Development Program' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 5: Student Organizations and Activities' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 6: Student Assistance Program' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 7: Specialized Student Services' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 8: Alumni Relations' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 5: ENTREPRENEURSHIP AND EMPLOYABILITY
            // ════════════════════════════════════════════════════════════════
            'Area 5: Entrepreneurship and Employability' => [
                'Sub Area 1: Involvement of Industry in Curriculum Development and Planning' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => [
                        'Item 1' => ['Sub-item a','Sub-item i','Sub-item ii','Sub-item iii','Sub-item iv','Sub-item v','Sub-item b','Sub-item c'],
                        'Item 2' => [],
                        'Item 3' => [],
                    ],
                ],
                'Sub Area 2: Involvement of Practitioners in the Teaching Process' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 3: On-the-Job Training' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],'Item 12'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[]],
                ],
                'Sub Area 4: Resource Sharing Between School and Industry' => [
                    'input'   => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],
                        'Item 6' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 5: LCU-LGU Industry Partnership for Job Placement and Employment' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 6: Continuous Search for Industry Partners' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 7: Entrepreneurship' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 6: COMMUNITY EXTENSION SERVICES
            // ════════════════════════════════════════════════════════════════
            'Area 6: Community Extension Services' => [
                'Sub Area 1: Community Extension Services' => [
                    'input' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2','Sub-item 1.3'],
                        'Item 2' => [],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g','Sub-item h'],
                        'Item 4' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f'],
                        'Item 5' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e'],
                        'Item 6' => [],
                    ],
                    'process' => [
                        'Item 1' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e'],
                        'Item 2' => [],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e'],
                        'Item 4' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g'],
                        'Item 5' => ['Sub-item 1','Sub-item 2','Sub-item 3','Sub-item 4','Sub-item 5','Sub-item 6','Sub-item a','Sub-item b','Sub-item c'],
                        'Item 6' => [],
                        'Item 7' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                    ],
                    'outcome' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],
                        'Item 8' => ['Sub-item a','Sub-item b','Sub-item c'],
                    ],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 7: RESEARCH
            // ════════════════════════════════════════════════════════════════
            'Area 7: Research' => [
                'Sub Area 1: Priorities and Relevance' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],
                        'Item 6' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d'],
                        'Item 7' => [],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 2: Funding, Instructional Support and Other Resources' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],
                        'Item 5' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 6' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f'],
                        'Item 7' => [],
                        'Item 8' => ['Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item g','Sub-item h'],
                        'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 3: Quality of Research Outputs' => [
                    'input' => [
                        'Item 1'=>[],
                        'Item 2' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 3' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 4'=>[],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                ],
                'Sub Area 4: Publication, Dissemination and Utilization' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                ],
                'Sub Area 5: LCU Research Partner of the Local Government Unit, Community and Industry' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 8: LIBRARY
            // ════════════════════════════════════════════════════════════════
            'Area 8: Library' => [
                'Sub Area 1: Administration and Personnel' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],'Item 12'=>[],'Item 13'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 2: Collections' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],
                        'Item 11' => ['Sub-item 11.1','Sub-item 11.2','Sub-item 11.3','Sub-item 11.4','Sub-item 11.5'],
                        'Item 12' => ['Sub-item 12.1','Sub-item 12.2','Sub-item 12.3','Sub-item 12.4','Sub-item 12.5','Sub-item 12.6'],
                        'Item 13' => ['Sub-item 13.1','Sub-item 13.2','Sub-item 13.3'],
                        'Item 14' => ['Sub-item 14.1','Sub-item 14.2','Sub-item 14.3','Sub-item 14.4'],
                        'Item 15'=>[],'Item 16'=>[],
                    ],
                    'process' => [
                        'Item 1'=>[],
                        'Item 2' => ['Sub-item 2.1','Sub-item 2.2','Sub-item 2.3','Sub-item 2.4','Sub-item 2.5','Sub-item 2.6','Sub-item 2.7','Sub-item 2.8','Sub-item 2.9'],
                        'Item 3'=>[],
                    ],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 3: Budget' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>['Sub-item a','Sub-item b']],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 4: Services and Use' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2','Sub-item 1.3'],
                        'Item 2' => ['Sub-item 2.1','Sub-item 2.2'],
                        'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],
                    ],
                    'outcome' => [
                        'Item 1' => ['Sub-item a','Sub-item b'],
                        'Item 2' => [],
                        'Item 3' => ['Sub-item 3.1','Sub-item 3.2'],
                    ],
                ],
                'Sub Area 5: Physical Set-Up' => [
                    'input' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2'],
                        'Item 2' => ['Sub-item 2.1','Sub-item 2.2','Sub-item 2.3','Sub-item 2.4','Sub-item 2.5','Sub-item 2.6'],
                        'Item 3' => ['Sub-item 3.1','Sub-item 3.2','Sub-item 3.3'],
                        'Item 4' => ['Sub-item 4.1','Sub-item 4.2','Sub-item 4.3'],
                        'Item 5' => ['Sub-item 5.1'],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 6: Technology' => [
                    'input' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2','Sub-item a','Sub-item b','Sub-item 1.3','Sub-item 1.4','Sub-item 1.5','Sub-item 1.6','Sub-item 1.7','Sub-item 1.8','Sub-item 1.9','Sub-item 2.0'],
                        'Item 2'=>[],'Item 3'=>[],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 9: LABORATORIES
            // ════════════════════════════════════════════════════════════════
            'Area 9: Laboratories' => [
                'Sub Area 1: Lecture Rooms' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 2: Laboratory Rooms' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],
                        'Item 9'  => ['Sub-item 9.1','Sub-item 9.2'],
                        'Item 10' => ['Sub-item 10.1','Sub-item 10.2','Sub-item 10.3'],
                        'Item 11' => [],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 3: Specific Laboratory Requirements' => [
                    'input' => [
                        'Item 1' => ['Sub-item 1.1','Sub-item 1.2','Sub-item 1.3','Sub-item 1.4','Sub-item 1.5','Sub-item 1.6'],
                        'Item 2' => ['Sub-item 2.1','Sub-item 2.2','Sub-item 2.3','Sub-item 2.4','Sub-item 2.5','Sub-item 2.6'],
                        'Item 3' => ['Sub-item 3.1','Sub-item 3.2','Sub-item 3.3','Sub-item 3.4','Sub-item 3.5'],
                        'Item 4' => ['Sub-item 4.1','Sub-item 4.2','Sub-item 4.3','Sub-item 4.4','Sub-item 4.5'],
                        'Item 5' => [],
                    ],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 4: Safety' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],
                        'Item 10' => ['Sub-item a','Sub-item b'],
                        'Item 11'=>[],'Item 12'=>[],'Item 13'=>[],'Item 14'=>[],'Item 15'=>[],'Item 16'=>[],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                ],
                'Sub Area 5: Equipment and Supplies' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 6: Maintenance and Improvement' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                ],
                'Sub Area 7: Special Provisions' => [
                    'input' => [
                        'Item 1'=>[],
                        'Item 2' => ['Sub-item 2.1','Sub-item 2.2','Sub-item a','Sub-item b','Sub-item c','Sub-item d','Sub-item e','Sub-item f','Sub-item 2.4','Sub-item 2.5','Sub-item 2.6','Sub-item 2.7','Sub-item 2.9'],
                        'Item 3' => ['Sub-item 3.1','Sub-item 3.2'],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
            ],

            // ════════════════════════════════════════════════════════════════
            // AREA 10: PHYSICAL PLANT
            // ════════════════════════════════════════════════════════════════
            'Area 10: Physical Plant' => [
                'Sub Area 1: Site' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 2: Campus' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 3: Building' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],'Item 12'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 4: Classrooms' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 5: Offices and Staff Rooms / Function Rooms' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 6: Auditorium' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],'Item 10'=>[],'Item 11'=>[],'Item 12'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 7: Athletic Facilities' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[],'Item 7'=>[]],
                    'process' => ['Item 1'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
                'Sub Area 8: Medical/Dental Clinic' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[],'Item 4'=>[],'Item 5'=>[],'Item 6'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[]],
                ],
                'Sub Area 9: Food Services Area(s)' => [
                    'input' => [
                        'Item 1'=>[],'Item 2'=>[],'Item 3'=>[],
                        'Item 4' => ['Sub-item a','Sub-item b','Sub-item c'],
                        'Item 5'=>[],'Item 6'=>[],'Item 7'=>[],'Item 8'=>[],'Item 9'=>[],
                    ],
                    'process' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'outcome' => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                ],
                'Sub Area 10: Student Center' => [
                    'input'   => ['Item 1'=>[],'Item 2'=>[],'Item 3'=>[]],
                    'process' => ['Item 1'=>[],'Item 2'=>[]],
                    'outcome' => ['Item 1'=>[]],
                ],
            ],
        ];
    }
}
