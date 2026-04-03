<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\SubArea;
use App\Services\AreaSurveyExportService;
use App\Services\SubAreaPdfExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    public function subArea(Request $request, SubArea $subArea)
    {
        $user      = $request->user()->load('roles');
        $role      = $user->roles->first()?->slug ?? '';
        $programId = $request->query('program_id', $user->program_id);

        // Only roles with visibility can export
        if (!in_array($role, ['director', 'dean', 'area-coordinator', 'program-coordinator', 'admin'])) {
            abort(403);
        }

        if (!$programId) {
            return back()->with('error', 'No program selected for export.');
        }

        try {
            $service = new SubAreaPdfExportService();
            $pdfPath = $service->export($subArea, (int) $programId);

            $subArea->load('area');
            $filename = sprintf(
                'QUAMC_%s_%s.pdf',
                str_replace([' ', '/'], '_', $subArea->area->name ?? 'area'),
                str_replace([' ', '/'], '_', $subArea->name)
            );

            return response()->download($pdfPath, $filename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('PDF export failed: ' . $e->getMessage());
            return back()->with('error', 'PDF export failed: ' . $e->getMessage());
        }
    }

    /**
     * Export a full Area as an ALCU-format survey PDF:
     *   Page 1 — White QUAMC cover
     *   Page 2 — Area summary (sub-areas rating table)
     *   Per sub-area — survey header page + actual uploaded files
     */
    public function area(Request $request, Area $area)
    {
        $user      = $request->user()->load('roles');
        $role      = $user->roles->first()?->slug ?? '';
        $programId = $request->query('program_id', $user->program_id);

        if (!in_array($role, ['director', 'dean', 'area-coordinator', 'program-coordinator', 'admin'])) {
            abort(403);
        }

        if (!$programId) {
            return back()->with('error', 'No program selected for export.');
        }

        try {
            $service  = new AreaSurveyExportService();
            $pdfPath  = $service->export($area, (int) $programId);

            $filename = sprintf(
                'QUAMC_Area_%s_%s.pdf',
                str_replace([' ', '/'], '_', $area->order_number ?? ''),
                str_replace([' ', '/'], '_', $area->name)
            );

            return response()->download($pdfPath, $filename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Area PDF export failed: ' . $e->getMessage());
            return back()->with('error', 'Area export failed: ' . $e->getMessage());
        }
    }
}
