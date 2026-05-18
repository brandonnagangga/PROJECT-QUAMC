<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\AreaItem;
use App\Models\AreaItemResponse;
use App\Models\SubArea;
use Illuminate\Database\Seeder;

/**
 * Seeds Area 1 (Governance and Administration) — Sub-Areas 1, 2, 3
 * with the actual PAASCU criterion text as item labels.
 *
 * - AreaItem.label = criterion text (managed in Area Management)
 *
 * Safe to run repeatedly: clears and re-seeds only Area 1 items.
 *
 * Usage:
 *   php artisan db:seed --class=Area1FullSeeder
 */
class Area1FullSeeder extends Seeder
{
    public function run(): void
    {
        $area = Area::where('name', 'like', '%Governance%')->first();
        if (!$area) {
            $this->command->error('Area 1 (Governance and Administration) not found.');
            return;
        }

        $this->command->info('Seeding Area 1 items.');

        foreach ($this->data() as $subAreaName => $ipoData) {
            $subArea = SubArea::where('area_id', $area->id)
                ->where('name', 'like', '%' . $this->keyword($subAreaName) . '%')
                ->first();

            if (!$subArea) {
                $this->command->warn("  Sub-area not found: {$subAreaName}");
                continue;
            }

            // Clear existing items for this sub-area.
            $itemIds = AreaItem::where('sub_area_id', $subArea->id)->pluck('id');
            AreaItemResponse::whereIn('area_item_id', $itemIds)->delete();
            AreaItem::where('sub_area_id', $subArea->id)->delete();
            $this->command->info("  Re-seeding: {$subArea->name}");

            foreach (['input', 'process', 'outcome'] as $ipo) {
                $items       = $ipoData[$ipo] ?? [];
                $parentOrder = 0;

                foreach ($items as $criterionText => $subItems) {
                    $parentOrder++;

                    $parent = AreaItem::create([
                        'sub_area_id'    => $subArea->id,
                        'ipo_type'       => $ipo,
                        'parent_item_id' => null,
                        'label'          => $criterionText,
                        'order_number'   => $parentOrder,
                    ]);

                    if (is_array($subItems)) {
                        $childOrder = 0;
                        foreach ($subItems as $childText) {
                            $childOrder++;
                            AreaItem::create([
                                'sub_area_id'    => $subArea->id,
                                'ipo_type'       => $ipo,
                                'parent_item_id' => $parent->id,
                                'label'          => $childText,
                                'order_number'   => $childOrder,
                            ]);
                        }
                    }
                }
            }
        }

        $subAreaIds = SubArea::where('area_id', $area->id)->pluck('id');
        $itemCount  = AreaItem::whereIn('sub_area_id', $subAreaIds)->count();
        $respCount  = AreaItemResponse::whereHas('item', fn($q) =>
            $q->whereIn('sub_area_id', $subAreaIds)
        )->count();
        $this->command->info("Area1FullSeeder done — {$itemCount} items, {$respCount} responses seeded.");
    }

    private function keyword(string $name): string
    {
        $parts   = explode(':', $name, 2);
        $keyword = trim($parts[1] ?? $parts[0]);
        return implode(' ', array_slice(explode(' ', $keyword), 0, 2));
    }

    private function data(): array
    {
        return [

            // ══════════════════════════════════════════════════════════════
            // Sub-Area 1: Administrative Organization
            // ══════════════════════════════════════════════════════════════
            'Sub Area 1: Administrative Organization' => [

                'input' => [
                    'The Board of Regents/Board of Trustees which is the policy making body of the school is chaired by the Local Chief Executive or his duly designated representative and vice-chaired by the President of the University/College.'
                        => [],

                    'The Board includes at least seven Members of the Board shall include Distinguished Citizens, of the Local Community, the Academe, the Sanggunian, Industry Partners, Stakeholders, and other appropriate sectoral representation, or whichever is required by the Charter or the ordinance of the institution.'
                        => [],

                    'The administrative officials include the following:'
                        => [
                            'President',
                            'Vice President/s',
                            'Finance/ Budget Officer',
                            'Accountant',
                            'Human Resource Manager',
                            'Registrar',
                        ],
                ],

                'process' => [
                    'The institution, through its governing structure, conducts annual planning that includes all sectors of the institution in order to:'
                        => [
                            'review and revisit its Vision, Mission, Goals and Objectives (VMGO)',
                            'formulate and provide Annual Investment Plan, Annual Procurement Plan, Medium Term Procurement Plan and other similar documents',
                        ],

                    'The institution monitors the program implementation that is stipulated in the Strategic Action Plan.'
                        => [],

                    'The administrative officials are appointed in accordance with the Civil Service Commission (CSC) Qualification Standards and other pertinent memorandum circulars.'
                        => [],

                    'The Board performs its duties and functions as stipulated in the University/College Charter or Code.'
                        => [],
                ],

                'outcome' => [
                    'The VMGO is clearly practiced by all members of the institution.'
                        => [],
                    'Strategic Plans / Action Plan are cascaded up to the lowest member of the institution.'
                        => [],
                    'Professional, qualified and competent top management officials are employed by the institution.'
                        => [],
                    'Sound and clear policies are in place to guide the institution in carrying out its operations and programs.'
                        => [],
                ],
            ],

            // ══════════════════════════════════════════════════════════════
            // Sub-Area 2: Academic Administration
            // ══════════════════════════════════════════════════════════════
            'Sub Area 2: Academic Administration' => [

                'input' => [
                    'Academic Administration Officials include the following:'
                        => [
                            'Deans',
                            'Assistant Deans or Assistant College Heads',
                            'College Secretary',
                            'Area Coordinators or Area Chairs',
                            'Department Head',
                        ],

                    'The following Academic Officials have the academic qualifications as prescribed by CHED:'
                        => [
                            'Deans/College Heads',
                            'Assistant Deans',
                            'Area Coordinators/Area Chairs',
                            'Dean of Student Affairs',
                        ],

                    'There is a Faculty Federation/Faculty Club supportive of institutional goals.'
                        => [],

                    'There is a mechanism for:'
                        => [
                            'performance evaluation',
                            'rewards and incentives',
                            'faculty development',
                        ],
                ],

                'process' => [
                    'The Institution periodically reviews and enhances systems and standards.'
                        => [],

                    'The Institution regularly conducts:'
                        => [
                            'performance evaluation',
                            'rewards and incentives',
                            'faculty development',
                        ],
                ],

                'outcome' => [
                    'University-wide awareness of systems and standards.'  => [],
                    'Systems are fully implemented.'                       => [],
                    'Professional and competent faculty are recruited.'    => [],
                    'Improved faculty performance.'                        => [],
                    'Implemented faculty development program.'             => [],
                ],
            ],

            // ══════════════════════════════════════════════════════════════
            // Sub-Area 3: Administration of Non-Academic Personnel
            // ══════════════════════════════════════════════════════════════
            'Sub Area 3: Administration of Non-Academic Personnel' => [

                'input' => [
                    'Clearly defined hiring procedures.'    => [],
                    'Orientation program for personnel.'    => [],
                    'Defined duties of employees.'          => [],
                    'Terms of employment are defined.'      => [],
                    'Development program exists.'           => [],
                    'Performance evaluation exists.'        => [],
                    'Ranking system exists with:'
                        => [
                            'Promotion procedures',
                            'Qualification standards',
                            'CSC policies',
                            'List of promoted employees',
                        ],
                    'Grievance committee exists.'           => [],
                    'Leave benefits are provided.'          => [],
                ],

                'process' => [
                    'Institution implements procedures on:'
                        => [
                            'recruitment',
                            'orientation',
                            'development',
                            'evaluation',
                            'promotion',
                            'health and safety',
                            'grievance handling',
                            'leave',
                            'others',
                        ],
                ],

                'outcome' => [
                    'Procedures are implemented.'     => [],
                    'Employee satisfaction.'          => [],
                    'Low turnover.'                   => [],
                    'Promotions documented.'          => [],
                    'Sufficient qualified staff.'     => [],
                ],
            ],
        ];
    }
}
