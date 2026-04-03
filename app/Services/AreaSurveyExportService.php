<?php

namespace App\Services;

use App\Models\Area;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Program;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use setasign\Fpdi\Fpdi;

class AreaSurveyExportService
{
    /**
     * Export an entire Area as an organised survey PDF.
     *
     * Structure:
     *  1. White QUAMC cover page
     *  2. Area summary page  (ALCU format – lists all sub-areas in rating table)
     *  3. For each sub-area:
     *       a. Sub-area survey page (Headers: INPUTS / PROCESSES / OUTCOMES rows)
     *       b. Actual uploaded files merged in sequence  (input → process → outcome)
     *
     * Returns the path to the final merged PDF (temp file).
     */
    public function export(Area $area, int $programId): string
    {
        $area->load(['subAreas' => fn ($q) => $q->where('is_archived', false)->orderBy('order_number')]);
        $program = Program::find($programId);

        $institution        = Setting::getValue('institution', 'State University');
        $accreditationBody  = Setting::getValue('accreditationBody', 'AACCUP');

        $pdfPaths  = [];
        $tempFiles = [];
        $pageNumber = 1;

        // ── 1. QUAMC white cover page ──────────────────────────────────────
        $coverPath = $this->makeCoverPage($area, $program, $institution, $pageNumber);
        $pdfPaths[]  = $coverPath;
        $tempFiles[] = $coverPath;
        $pageNumber++;

        // ── 2. Area summary page (ALCU format) ─────────────────────────────
        $subAreaNames = $area->subAreas->pluck('name')->toArray();
        $summaryPath  = $this->makeAreaSummaryPage(
            $area, $subAreaNames, $accreditationBody, $pageNumber
        );
        $pdfPaths[]  = $summaryPath;
        $tempFiles[] = $summaryPath;
        $pageNumber++;

        // ── 3. Per sub-area: divider page + actual files in sequence ───────
        foreach ($area->subAreas as $saIndex => $subArea) {
            $docs = Document::where('sub_area_id', $subArea->id)
                ->where('program_id', $programId)
                ->get()
                ->keyBy('doc_type');

            // 3a. Simple divider page (sub-area name + slot status badges)
            $subAreaPage = $this->makeSubAreaDivider(
                $area->name,
                $subArea->name,
                $saIndex + 1,
                $docs->has('input'),
                $docs->has('process'),
                $docs->has('outcome'),
                $pageNumber
            );
            $pdfPaths[]  = $subAreaPage;
            $tempFiles[] = $subAreaPage;
            $pageNumber++;

            // 3b. Append actual uploaded files: input → process → outcome
            foreach (['input', 'process', 'outcome'] as $docType) {
                if (!$docs->has($docType)) {
                    continue; // slot empty — skip
                }

                $version = DocumentVersion::where('document_id', $docs[$docType]->id)
                    ->orderByDesc('version_number')
                    ->first();

                if (!$version) {
                    continue;
                }

                $filePdf = $this->convertToPdf($version->file_path, $tempFiles);
                if ($filePdf) {
                    $pdfPaths[] = $filePdf;
                }
            }
        }

        // ── 4. Merge all into one final PDF ────────────────────────────────
        $finalPath = $this->mergePdfs($pdfPaths);

        // ── 5. Clean up temp files ──────────────────────────────────────────
        foreach ($tempFiles as $f) {
            if (file_exists($f) && $f !== $finalPath) {
                @unlink($f);
            }
        }

        return $finalPath;
    }

    /* ── Private helpers ── */

    private function makeCoverPage(Area $area, ?Program $program, string $institution, int $pageNum): string
    {
        $html = view('pdf.survey_cover', [
            'area_name'    => $area->name,
            'program_name' => $program?->name ?? '',
            'program_code' => $program?->code ?? '',
            'institution'  => strtoupper($institution),
            'date'         => now()->format('F j, Y'),
        ])->render();

        return $this->renderToPdf($html, 'cover');
    }

    private function makeAreaSummaryPage(Area $area, array $subAreaNames, string $accreditationBody, int $pageNum): string
    {
        // Determine area letter/number from order_number
        $areaLetter = $area->order_number ? $this->numberToRoman($area->order_number) : ($area->order_number ?? '');

        $html = view('pdf.survey_area_summary', [
            'area_name'          => $area->name,
            'area_letter'        => $areaLetter,
            'sub_areas'          => $subAreaNames,
            'accreditation_body' => strtoupper($accreditationBody),
            'page_number'        => $pageNum,
        ])->render();

        return $this->renderToPdf($html, 'summary');
    }

    private function makeSubAreaDivider(
        string $areaName, string $subAreaName, int $subAreaIndex,
        bool $hasInput, bool $hasProcess, bool $hasOutcome, int $pageNum
    ): string {
        $html = view('pdf.survey_subarea', [
            'area_name'       => $areaName,
            'sub_area_name'   => $subAreaName,
            'sub_area_index'  => $subAreaIndex,
            'has_input'       => $hasInput,
            'has_process'     => $hasProcess,
            'has_outcome'     => $hasOutcome,
            'page_number'     => $pageNum,
        ])->render();

        return $this->renderToPdf($html, 'subarea');
    }

    private function renderToPdf(string $html, string $prefix): string
    {
        $pdf  = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $path = tempnam(sys_get_temp_dir(), 'quamc_' . $prefix . '_') . '.pdf';
        $pdf->save($path);
        return $path;
    }

    private function convertToPdf(string $filePath, array &$tempFiles): ?string
    {
        $fullPath = storage_path('app/' . $filePath);
        if (!file_exists($fullPath)) {
            return null;
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        if ($ext === 'pdf') {
            return $fullPath;
        }

        if (in_array($ext, ['doc', 'docx', 'xlsx', 'xls', 'pptx', 'ppt'])) {
            $outDir     = sys_get_temp_dir();
            $libreoffice = env('LIBREOFFICE_PATH', 'soffice');
            $escaped    = escapeshellarg($fullPath);
            $escapedDir = escapeshellarg($outDir);

            $cmd = "\"{$libreoffice}\" --headless --convert-to pdf --outdir {$escapedDir} {$escaped} 2>&1";
            exec($cmd, $output, $exitCode);

            $converted = $outDir . DIRECTORY_SEPARATOR . pathinfo($fullPath, PATHINFO_FILENAME) . '.pdf';

            if ($exitCode === 0 && file_exists($converted)) {
                $tempFiles[] = $converted;
                return $converted;
            }

            \Log::warning("LibreOffice conversion failed for {$fullPath}: " . implode("\n", $output));
            return null;
        }

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $dataUri = 'data:image/' . $ext . ';base64,' . base64_encode(file_get_contents($fullPath));
            $html    = '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">'
                     . '<img src="' . $dataUri . '" style="max-width:100%;max-height:100%;object-fit:contain;" />'
                     . '</body></html>';

            $path = tempnam(sys_get_temp_dir(), 'quamc_img_') . '.pdf';
            Pdf::loadHTML($html)->setPaper('a4', 'portrait')->save($path);
            $tempFiles[] = $path;
            return $path;
        }

        return null;
    }

    private function mergePdfs(array $pdfPaths): string
    {
        $merger = new Fpdi();

        foreach ($pdfPaths as $path) {
            if (!file_exists($path)) {
                continue;
            }

            try {
                $pageCount = $merger->setSourceFile($path);
                for ($i = 1; $i <= $pageCount; $i++) {
                    $tpl         = $merger->importPage($i);
                    $size        = $merger->getTemplateSize($tpl);
                    $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                    $merger->AddPage($orientation, [$size['width'], $size['height']]);
                    $merger->useTemplate($tpl);
                }
            } catch (\Exception $e) {
                \Log::warning("FPDI could not include PDF: {$path} — " . $e->getMessage());
            }
        }

        $finalPath = tempnam(sys_get_temp_dir(), 'quamc_area_export_') . '.pdf';
        $merger->Output($finalPath, 'F');

        return $finalPath;
    }

    /** Convert integer to Roman numeral (for area numbering like Area I, II, III...) */
    private function numberToRoman(int $num): string
    {
        $map = [
            10 => 'X', 9 => 'IX', 8 => 'VIII', 7 => 'VII', 6 => 'VI',
            5  => 'V', 4 => 'IV', 3 => 'III',  2 => 'II',  1 => 'I',
        ];
        $result = '';
        foreach ($map as $value => $numeral) {
            while ($num >= $value) {
                $result .= $numeral;
                $num -= $value;
            }
        }
        return $result ?: (string) $num;
    }
}
