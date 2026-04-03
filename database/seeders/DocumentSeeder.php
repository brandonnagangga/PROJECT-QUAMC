<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\AreaAssignment;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Program;
use App\Models\SubArea;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentSeeder extends Seeder
{
    public function run(): void
    {
        $santos   = User::where('email', 'jsantos@quamc.edu')->first();
        $delaRosa = User::where('email', 'mdelarosa@quamc.edu')->first();
        $janJames = User::where('email', 'janjames@quamc.edu')->first();
        $gabriel  = User::where('email', 'gabriel@quamc.edu')->first();
        $director = User::where('email', 'director@quamc.edu')->first();

        $bsit = Program::where('code', 'BSIT')->first();
        $bsba = Program::where('code', 'BSBA')->first();
        $bsn  = Program::where('code', 'BSN')->first();
        $bsed = Program::where('code', 'BSED')->first();

        // Areas are global — find by order_number (no program_id)
        $area1 = Area::where('order_number', 1)->first();
        $area2 = Area::where('order_number', 2)->first();
        $area3 = Area::where('order_number', 3)->first();
        $area5 = Area::where('order_number', 5)->first();
        $area7 = Area::where('order_number', 7)->first();

        // ── Assign Santos to Area 3 (Coordinator for BSIT) ──
        if ($santos && $area3 && $gabriel) {
            AreaAssignment::create([
                'user_id'       => $santos->id,
                'area_id'       => $area3->id,
                'assigned_by'   => $gabriel->id,
                'role_type'     => 'area_coord',
                'academic_year' => '2025-2026',
            ]);
        }

        // ── Assign Jan James as program coord for areas 1, 2, 3 (BSIT) ──
        foreach ([$area1, $area2, $area3] as $area) {
            if ($area && $janJames && $gabriel) {
                AreaAssignment::firstOrCreate([
                    'user_id'       => $janJames->id,
                    'area_id'       => $area->id,
                    'academic_year' => '2025-2026',
                ], [
                    'assigned_by' => $gabriel->id,
                    'role_type'   => 'program_coord',
                ]);
            }
        }

        // ── Sample documents using new schema: sub_area_id + program_id + doc_type ──
        $area3sub1 = $area3?->subAreas()->where('order_number', 1)->first();
        $area3sub2 = $area3?->subAreas()->where('order_number', 2)->first();
        $area3sub3 = $area3?->subAreas()->where('order_number', 3)->first();
        $area2sub1 = $area2?->subAreas()->where('order_number', 1)->first();
        $area5sub1 = $area5?->subAreas()->where('order_number', 1)->first();
        $area7sub1 = $area7?->subAreas()->where('order_number', 1)->first();
        $area1sub1 = $area1?->subAreas()->where('order_number', 1)->first();

        $sampleDocs = [
            [
                'title'       => 'CMO Alignment Matrix',
                'sub_area_id' => $area3sub1?->id,
                'program_id'  => $bsit?->id,
                'doc_type'    => 'process',
                'uploaded_by' => $santos?->id,
                'status'      => 'pending_review',
            ],
            [
                'title'       => 'Course Offerings List',
                'sub_area_id' => $area3sub1?->id,
                'program_id'  => $bsit?->id,
                'doc_type'    => 'input',
                'uploaded_by' => $santos?->id,
                'status'      => 'approved',
            ],
            [
                'title'       => 'CMO Compliance Outcome Report',
                'sub_area_id' => $area3sub3?->id,
                'program_id'  => $bsit?->id,
                'doc_type'    => 'outcome',
                'uploaded_by' => $santos?->id,
                'status'      => 'draft',
            ],
            [
                'title'       => 'Faculty List AY 2024-2025',
                'sub_area_id' => $area2sub1?->id,
                'program_id'  => $bsit?->id,
                'doc_type'    => 'input',
                'uploaded_by' => $santos?->id,
                'status'      => 'approved',
            ],
            [
                'title'       => 'Research Output Summary',
                'sub_area_id' => $area5sub1?->id,
                'program_id'  => $bsn?->id,
                'doc_type'    => 'outcome',
                'uploaded_by' => $delaRosa?->id,
                'status'      => 'approved',
            ],
            [
                'title'       => 'Library Holdings Report',
                'sub_area_id' => $area7sub1?->id,
                'program_id'  => $bsba?->id,
                'doc_type'    => 'process',
                'uploaded_by' => $delaRosa?->id,
                'status'      => 'returned',
            ],
            [
                'title'       => 'Vision Mission Statement',
                'sub_area_id' => $area1sub1?->id,
                'program_id'  => $bsed?->id,
                'doc_type'    => 'input',
                'uploaded_by' => $santos?->id,
                'status'      => 'approved',
            ],
        ];

        foreach ($sampleDocs as $docData) {
            // Skip if sub_area or program is missing
            if (!$docData['sub_area_id'] || !$docData['program_id'] || !$docData['uploaded_by']) {
                continue;
            }

            // Only one document per slot (unique constraint: sub_area_id + program_id + doc_type)
            $existing = Document::where('sub_area_id', $docData['sub_area_id'])
                ->where('program_id', $docData['program_id'])
                ->where('doc_type', $docData['doc_type'])
                ->exists();
            if ($existing) continue;

            $doc = Document::create([
                'title'       => $docData['title'],
                'sub_area_id' => $docData['sub_area_id'],
                'program_id'  => $docData['program_id'],
                'doc_type'    => $docData['doc_type'],
                'uploaded_by' => $docData['uploaded_by'],
                'status'      => $docData['status'],
            ]);

            DocumentVersion::create([
                'document_id'       => $doc->id,
                'uploaded_by'       => $doc->uploaded_by,
                'version_number'    => 1,
                'file_path'         => 'documents/sample/' . Str::slug($doc->title) . '_v1.pdf',
                'original_filename' => Str::slug($doc->title, '_') . '_v1.pdf',
                'file_size_bytes'   => rand(500000, 2000000),
                'mime_type'         => 'application/pdf',
                'notes'             => null,
            ]);
        }

        // ── Sample activity logs ──
        $events = [
            ['user' => $santos,   'event' => 'document.uploaded',   'text' => 'Uploaded CMO Alignment Matrix'],
            ['user' => $gabriel,  'event' => 'document.approved',   'text' => 'Approved Research Output Summary'],
            ['user' => $delaRosa,'event' => 'document.uploaded',    'text' => 'Uploaded Library Holdings Report'],
            ['user' => $director, 'event' => 'document.approved',   'text' => 'Final approval for Faculty List'],
            ['user' => $janJames, 'event' => 'document.returned',   'text' => 'Returned Library Holdings for revision'],
        ];

        foreach ($events as $idx => $evt) {
            if (!$evt['user']) continue;
            ActivityLog::create([
                'user_id'    => $evt['user']->id,
                'event'      => $evt['event'],
                'model_type' => 'Document',
                'model_id'   => Str::uuid(),
                'changes'    => ['action' => $evt['text']],
                'ip_address' => '127.0.0.1',
                'created_at' => now()->subHours($idx * 2),
            ]);
        }
    }
}
