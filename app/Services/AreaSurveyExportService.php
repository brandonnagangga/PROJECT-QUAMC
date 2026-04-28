<?php

namespace App\Services;

use App\Models\Area;
use App\Models\AccreditationCycle;
use App\Models\AreaItem;
use App\Models\AreaItemFile;
use App\Models\AreaItemResponse;
use App\Models\Program;
use App\Models\Setting;
use App\Models\SubArea;
use Barryvdh\DomPDF\Facade\Pdf;
use setasign\Fpdi\Fpdi;

class AreaSurveyExportService
{
    /**
     * Export an entire Area as an organised survey PDF.
     *
     * Structure:
     *  1. QUAMC white cover page
     *  2. Area summary page (sub-areas + computed ratings table)
     *  3. Per sub-area:
     *       a. Sub-area divider card
     *       b. Items content page (INPUTS / PROCESSES / OUTCOMES with narratives,
     *          extracted PDF text, embedded images, sub-items, and rating means)
     */
    public function export(Area $area, int $programId): string
    {
        $area->load(['subAreas' => fn($q) => $q->where('is_archived', false)->orderBy('order_number')]);
        $program  = Program::find($programId);
        $cycle    = AccreditationCycle::active();
        $cycleId  = $cycle?->id;

        $institution       = Setting::getValue('institution', 'State University');
        $accreditationBody = Setting::getValue('accreditationBody', 'AACCUP');

        $extractor  = new PdfTextExtractorService();
        $pdfPaths   = [];
        $tempFiles  = [];
        $pageNumber = 1;

        // ── Fast pass: compute sub-area ratings for summary table ────────────
        $subAreaRatings = [];
        foreach ($area->subAreas as $subArea) {
            $subAreaRatings[$subArea->id] = $this->computeSubAreaRating($subArea, $programId, $cycleId);
        }
        $areaFinalRating = count($subAreaRatings) > 0
            ? round(array_sum($subAreaRatings) / count($subAreaRatings), 2)
            : 0;

        // ── 1. Cover page ─────────────────────────────────────────────────────
        $coverPath   = $this->makeCoverPage($area, $program, $institution, $pageNumber);
        $pdfPaths[]  = $coverPath;
        $tempFiles[] = $coverPath;
        $pageNumber++;

        // ── 2. Area summary page ──────────────────────────────────────────────
        $subAreaNames = $area->subAreas->pluck('name')->toArray();
        $saRatingList = $area->subAreas->map(fn($sa) => $subAreaRatings[$sa->id] ?? null)->toArray();

        $summaryPath  = $this->makeAreaSummaryPage(
            $area, $subAreaNames, $accreditationBody, $pageNumber, $saRatingList, $areaFinalRating
        );
        $pdfPaths[]  = $summaryPath;
        $tempFiles[] = $summaryPath;
        $pageNumber++;

        // ── 3. Per sub-area: divider + items content page ─────────────────────
        foreach ($area->subAreas as $saIndex => $subArea) {
            // 3a. Divider card
            $groups = $this->buildIpoGroups($subArea, $programId, $cycleId, $extractor);

            $dividerPath = $this->makeSubAreaDivider(
                $area->name, $subArea->name, $saIndex + 1,
                !empty($groups['input']), !empty($groups['process']), !empty($groups['outcome']),
                $pageNumber
            );
            $pdfPaths[]  = $dividerPath;
            $tempFiles[] = $dividerPath;
            $pageNumber++;

            // 3b. Items content page
            $itemsPath   = $this->makeItemsContentPage(
                $area->name, $subArea->name, $saIndex + 1, $groups, $pageNumber
            );
            $pdfPaths[]  = $itemsPath;
            $tempFiles[] = $itemsPath;
            $pageNumber++;
        }

        // ── 4. Merge all into one PDF ─────────────────────────────────────────
        $finalPath = $this->mergePdfs($pdfPaths);

        // ── 5. Clean up temp files ────────────────────────────────────────────
        foreach ($tempFiles as $f) {
            if (file_exists($f) && $f !== $finalPath) {
                @unlink($f);
            }
        }

        return $finalPath;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Quickly compute a sub-area's weighted final rating without file extraction.
     * Formula: (inputMean×20%) + (processMean×30%) + (outcomeMean×50%)
     */
    private function computeSubAreaRating(SubArea $subArea, int $programId, ?int $cycleId): float
    {
        $byIpo = ['input' => [], 'process' => [], 'outcome' => []];

        $responses = AreaItemResponse::whereHas('item', fn($q) =>
                $q->where('sub_area_id', $subArea->id)->whereNull('parent_item_id')->where('is_archived', false)
            )
            ->where('program_id', $programId)
            ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
            ->whereNotNull('rating')
            ->with('item:id,ipo_type')
            ->get();

        foreach ($responses as $resp) {
            $ipo = $resp->item?->ipo_type;
            if ($ipo && isset($byIpo[$ipo])) {
                $byIpo[$ipo][] = $resp->rating;
            }
        }

        $im = count($byIpo['input'])   > 0 ? array_sum($byIpo['input'])   / count($byIpo['input'])   : 0;
        $pm = count($byIpo['process']) > 0 ? array_sum($byIpo['process']) / count($byIpo['process']) : 0;
        $om = count($byIpo['outcome']) > 0 ? array_sum($byIpo['outcome']) / count($byIpo['outcome']) : 0;

        return round(($im * 0.20) + ($pm * 0.30) + ($om * 0.50), 2);
    }

    /**
     * Build the full IPO data structure for a sub-area, including narratives,
     * extracted PDF text, and embedded images.
     */
    private function buildIpoGroups(SubArea $subArea, int $programId, ?int $cycleId, PdfTextExtractorService $extractor): array
    {
        $groups = ['input' => [], 'process' => [], 'outcome' => []];

        foreach (['input', 'process', 'outcome'] as $ipo) {
            $parentItems = AreaItem::where('sub_area_id', $subArea->id)
                ->where('ipo_type', $ipo)
                ->where('is_archived', false)
                ->whereNull('parent_item_id')
                ->orderBy('order_number')
                ->with(['children' => fn($q) => $q->where('is_archived', false)->orderBy('order_number')])
                ->get();

            foreach ($parentItems as $item) {
                // Narrative / rating come from AreaItemResponse
                $response = AreaItemResponse::where('area_item_id', $item->id)
                    ->where('program_id', $programId)
                    ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                    ->first();

                // ── Files queried DIRECTLY from AreaItemFile ──────────────────
                // Avoids response cycle_id mismatch that silently drops file lists.
                $directFiles = AreaItemFile::where('area_item_id', $item->id)
                    ->where('program_id', $programId)
                    ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                    ->get();

                $fileData = $this->buildFileData($directFiles, $extractor);

                // Sub-items
                $children = [];
                foreach ($item->children as $child) {
                    $childResponse = AreaItemResponse::where('area_item_id', $child->id)
                        ->where('program_id', $programId)
                        ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                        ->first();

                    $childFiles = AreaItemFile::where('area_item_id', $child->id)
                        ->where('program_id', $programId)
                        ->when($cycleId, fn($q) => $q->where('cycle_id', $cycleId))
                        ->get();

                    $children[] = [
                        'label'     => $child->label,
                        'narrative' => $childResponse?->content_text,
                        'files'     => $this->buildFileData($childFiles, $extractor),
                    ];
                }

                $groups[$ipo][] = [
                    'label'     => $item->label,
                    'narrative' => $response?->content_text,
                    'rating'    => $response?->rating,
                    'files'     => $fileData,
                    'children'  => $children,
                ];
            }
        }

        return $groups;
    }

    /**
     * Build the file data array for a response's files.
     * Handles PDFs (text extraction) and images (base64 embedding).
     */
    private function buildFileData($files, PdfTextExtractorService $extractor): array
    {
        $result = [];
        foreach ($files as $file) {
            // Files are stored on the 'private' disk → storage/app/private/
            // Fall back to the legacy storage/app/ path if needed.
            $absPath = storage_path('app/private/' . $file->file_path);
            if (!file_exists($absPath)) {
                $absPath = storage_path('app/' . $file->file_path);
            }

            $mime     = $file->mime_type ?? '';
            $isImage  = str_starts_with($mime, 'image/');
            $isPdf    = ($mime === 'application/pdf');

            $extractedText = null;
            $imageData     = null;

            if ($isPdf) {
                $extracted     = $extractor->extractFromPath($absPath);
                $extractedText = $extracted['text'];
            } elseif ($isImage) {
                $imageData = $extractor->imageToDataUri($absPath, $mime);
            }

            $result[] = [
                'original_filename' => $file->original_filename,
                'mime_type'         => $mime,
                'is_image'          => $isImage,
                'is_pdf'            => $isPdf,
                'extracted_text'    => $extractedText,
                'image_data'        => $imageData,
            ];
        }
        return $result;
    }

    private function makeItemsContentPage(
        string $areaName, string $subAreaName, int $subAreaIndex,
        array $ipoGroups, int $pageNum
    ): string {
        $html = view('pdf.survey_items_page', [
            'area_name'      => $areaName,
            'sub_area_name'  => $subAreaName,
            'sub_area_index' => $subAreaIndex,
            'ipo_groups'     => $ipoGroups,
            'page_number'    => $pageNum,
        ])->render();

        return $this->renderToPdf($html, 'items');
    }

    private function makeCoverPage(Area $area, ?Program $program, string $institution, int $pageNum): string
    {
        $html = view('pdf.survey_cover', [
            'area_name'     => $area->name,
            'program_name'  => $program?->name ?? '',
            'program_code'  => $program?->code ?? '',
            'program_logo'  => $program?->logoDataUri(),   // null if no logo
            'institution'   => strtoupper($institution),
            'date'          => now()->format('F j, Y'),
        ])->render();

        return $this->renderToPdf($html, 'cover');
    }

    private function makeAreaSummaryPage(
        Area $area, array $subAreaNames, string $accreditationBody,
        int $pageNum, array $subAreaRatings, float $areaFinalRating
    ): string {
        $areaLetter = $area->order_number ? $this->numberToRoman($area->order_number) : '';

        $html = view('pdf.survey_area_summary', [
            'area_name'          => $area->name,
            'area_letter'        => $areaLetter,
            'sub_areas'          => $subAreaNames,
            'sub_area_ratings'   => $subAreaRatings,
            'area_final_rating'  => $areaFinalRating,
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
            'area_name'      => $areaName,
            'sub_area_name'  => $subAreaName,
            'sub_area_index' => $subAreaIndex,
            'has_input'      => $hasInput,
            'has_process'    => $hasProcess,
            'has_outcome'    => $hasOutcome,
            'page_number'    => $pageNum,
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

    private function mergePdfs(array $pdfPaths): string
    {
        $merger = new Fpdi();

        foreach ($pdfPaths as $path) {
            if (!file_exists($path)) continue;
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

    private function numberToRoman(int $num): string
    {
        $map = [10=>'X',9=>'IX',8=>'VIII',7=>'VII',6=>'VI',5=>'V',4=>'IV',3=>'III',2=>'II',1=>'I'];
        $result = '';
        foreach ($map as $value => $numeral) {
            while ($num >= $value) { $result .= $numeral; $num -= $value; }
        }
        return $result ?: (string)$num;
    }
}
