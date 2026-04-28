<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Document;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReadinessController extends Controller
{
    private function buildProgramsData(): array
    {
        $areas = Area::with('subAreas')->orderBy('order_number')->get();

        $totalSlots    = 0;
        $approvedTotal = 0;
        $pendingTotal  = 0;
        $returnedTotal = 0;
        $draftTotal    = 0;

        $programsData = Program::where('is_active', true)->get()->map(
            function ($program) use ($areas, &$totalSlots, &$approvedTotal, &$pendingTotal, &$returnedTotal, &$draftTotal) {
                $pSlots    = 0;
                $pApproved = 0;
                $pPending  = 0;
                $pReturned = 0;
                $pDraft    = 0;

                $areaRows = $areas->map(function ($area) use ($program, &$pSlots, &$pApproved, &$pPending, &$pReturned, &$pDraft) {
                    $subAreaIds = $area->subAreas->pluck('id');
                    $aSlots     = $subAreaIds->count() * 3;

                    $docs = Document::whereIn('sub_area_id', $subAreaIds)
                        ->where('program_id', $program->id)
                        ->get();

                    $aApproved  = $docs->where('status', 'approved')->count();
                    $aPending   = $docs->where('status', 'pending_review')->count();
                    $aReturned  = $docs->where('status', 'returned')->count();
                    $aDraft     = $aSlots - $docs->count();

                    $pSlots    += $aSlots;
                    $pApproved += $aApproved;
                    $pPending  += $aPending;
                    $pReturned += $aReturned;
                    $pDraft    += max(0, $aDraft);

                    return [
                        'name'         => $area->name,
                        'order_number' => $area->order_number,
                        'total'        => $aSlots,
                        'approved'     => $aApproved,
                        'pending'      => $aPending,
                        'returned'     => $aReturned,
                        'draft'        => max(0, $aDraft),
                        'pct'          => $aSlots > 0 ? round(($aApproved / $aSlots) * 100) : 0,
                    ];
                })->values();

                $totalSlots    += $pSlots;
                $approvedTotal += $pApproved;
                $pendingTotal  += $pPending;
                $returnedTotal += $pReturned;
                $draftTotal    += $pDraft;

                return [
                    'id'       => $program->id,
                    'name'     => $program->name,
                    'code'     => $program->code,
                    'total'    => $pSlots,
                    'approved' => $pApproved,
                    'pending'  => $pPending,
                    'returned' => $pReturned,
                    'draft'    => $pDraft,
                    'pct'      => $pSlots > 0 ? round(($pApproved / $pSlots) * 100) : 0,
                    'areas'    => $areaRows,
                ];
            }
        )->toArray();

        return [
            'programsData'  => $programsData,
            'summary'       => [
                'totalItems'  => $totalSlots,
                'approved'    => $approvedTotal,
                'pending'     => $pendingTotal,
                'returned'    => $returnedTotal,
                'draft'       => $draftTotal,
                'overallPct'  => $totalSlots > 0 ? round(($approvedTotal / $totalSlots) * 100) : 0,
            ],
        ];
    }

    public function index()
    {
        $data = $this->buildProgramsData();

        return Inertia::render('Reports/Readiness', [
            'programs' => $data['programsData'],
            'summary'  => $data['summary'],
        ]);
    }

    public function export()
    {
        $data = $this->buildProgramsData();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.readiness-report', [
            'programs'      => $data['programsData'],
            'overallPct'    => $data['summary']['overallPct'],
            'totalItems'    => $data['summary']['totalItems'],
            'approvedItems' => $data['summary']['approved'],
            'generatedAt'   => now()->format('F j, Y g:i A'),
        ]);

        return $pdf->download('accreditation-readiness-report.pdf');
    }

    /**
     * Export readiness PDF for a single program.
     */
    public function exportProgram(Program $program)
    {
        $areas = Area::with('subAreas')->orderBy('order_number')->get();

        $pSlots    = 0;
        $pApproved = 0;
        $pPending  = 0;
        $pReturned = 0;
        $pDraft    = 0;

        $areaRows = $areas->map(function ($area) use ($program, &$pSlots, &$pApproved, &$pPending, &$pReturned, &$pDraft) {
            $subAreaIds = $area->subAreas->pluck('id');
            $aSlots     = $subAreaIds->count() * 3;

            $docs = Document::whereIn('sub_area_id', $subAreaIds)
                ->where('program_id', $program->id)
                ->get();

            $aApproved = $docs->where('status', 'approved')->count();
            $aPending  = $docs->where('status', 'pending_review')->count();
            $aReturned = $docs->where('status', 'returned')->count();
            $aDraft    = $aSlots - $docs->count();

            $pSlots    += $aSlots;
            $pApproved += $aApproved;
            $pPending  += $aPending;
            $pReturned += $aReturned;
            $pDraft    += max(0, $aDraft);

            return [
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'total'        => $aSlots,
                'approved'     => $aApproved,
                'pending'      => $aPending,
                'returned'     => $aReturned,
                'draft'        => max(0, $aDraft),
                'pct'          => $aSlots > 0 ? round(($aApproved / $aSlots) * 100) : 0,
            ];
        })->values();

        $programData = [
            'id'       => $program->id,
            'name'     => $program->name,
            'code'     => $program->code,
            'total'    => $pSlots,
            'approved' => $pApproved,
            'pending'  => $pPending,
            'returned' => $pReturned,
            'draft'    => $pDraft,
            'pct'      => $pSlots > 0 ? round(($pApproved / $pSlots) * 100) : 0,
            'areas'    => $areaRows,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.readiness-report', [
            'programs'      => [$programData],
            'overallPct'    => $programData['pct'],
            'totalItems'    => $pSlots,
            'approvedItems' => $pApproved,
            'generatedAt'   => now()->format('F j, Y g:i A'),
        ]);

        return $pdf->download("readiness-{$program->code}.pdf");
    }
}
