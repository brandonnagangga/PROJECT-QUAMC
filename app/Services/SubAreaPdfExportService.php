<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\SubArea;
use Barryvdh\DomPDF\Facade\Pdf;
use setasign\Fpdi\Fpdi;

class SubAreaPdfExportService
{
    private function appLogoDataUri(): ?string
    {
        $path = (string) \App\Models\Setting::getValue('appLogoPath', '');
        if ($path === '') {
            return null;
        }

        $candidates = [
            storage_path('app/private/' . $path),
            storage_path('app/' . $path),
        ];

        foreach ($candidates as $candidate) {
            if (!is_file($candidate)) {
                continue;
            }

            $mime = mime_content_type($candidate) ?: null;
            $data = @file_get_contents($candidate);
            if (!$mime || $data === false) {
                continue;
            }

            return 'data:' . $mime . ';base64,' . base64_encode($data);
        }

        return null;
    }

    /**
     * Main export method.
     * Returns the path to the final merged PDF (temp file).
     */
    public function export(SubArea $subArea, int $programId): string
    {
        $subArea->load('area');

        $pdfPaths  = [];
        $tempFiles = [];

        // 1. Cover page (always included)
        $coverPdf = $this->makeCoverPage($subArea, $programId);
        $pdfPaths[]  = $coverPdf;
        $tempFiles[] = $coverPdf;

        // 2. Loop through 3 fixed slots in order
        foreach (['input', 'process', 'outcome'] as $docType) {
            $version = $this->getLatestApprovedFile($subArea->id, $programId, $docType);

            if (!$version) {
                continue; // slot empty — skip divider + content
            }

            // Divider page for this type
            $divider    = $this->makeDividerPage($docType, $version);
            $pdfPaths[]  = $divider;
            $tempFiles[] = $divider;

            // Convert the actual file to PDF
            $filePdf = $this->convertToPdf($version->file_path, $tempFiles);
            if ($filePdf) {
                $pdfPaths[] = $filePdf;
            }
        }

        // 3. Merge all into one final PDF
        $finalPath = $this->mergePdfs($pdfPaths);

        // 4. Clean up temp files (keep the final)
        foreach ($tempFiles as $f) {
            if (file_exists($f) && $f !== $finalPath) {
                @unlink($f);
            }
        }

        return $finalPath;
    }

    /* ── Private Helpers ── */

    /**
     * Get the latest APPROVED document version for a slot.
     * Falls back to latest draft if no approved version exists.
     */
    private function getLatestApprovedFile(int $subAreaId, int $programId, string $docType): ?DocumentVersion
    {
        $document = Document::where('sub_area_id', $subAreaId)
            ->where('program_id', $programId)
            ->where('doc_type', $docType)
            ->first();

        if (!$document) {
            return null;
        }

        // Try to get the latest version
        return DocumentVersion::where('document_id', $document->id)
            ->orderByDesc('version_number')
            ->first();
    }

    /**
     * Generate a cover page PDF via DomPDF and return its temp path.
     */
    private function makeCoverPage(SubArea $subArea, int $programId): string
    {
        $program = \App\Models\Program::find($programId);

        $html = view('pdf.cover', [
            'area'       => $subArea->area->name ?? 'Unknown Area',
            'sub_area'   => $subArea->name,
            'program'    => $program?->name ?? 'Unknown Program',
            'program_code' => $program?->code ?? '',
            'program_logo' => $program?->logoDataUri(),
            'app_logo'   => $this->appLogoDataUri(),
            'date'       => now()->format('F j, Y'),
        ])->render();

        $pdf  = PDF::loadHTML($html)->setPaper('a4', 'portrait');
        $path = tempnam(sys_get_temp_dir(), 'quamc_cover_') . '.pdf';
        $pdf->save($path);

        return $path;
    }

    /**
     * Generate a section divider page PDF via DomPDF and return its temp path.
     */
    private function makeDividerPage(string $docType, DocumentVersion $version): string
    {
        $html = view('pdf.divider', [
            'type'     => ucfirst($docType),
            'filename' => $version->original_filename,
            'version'  => 'v' . $version->version_number,
        ])->render();

        $pdf  = PDF::loadHTML($html)->setPaper('a4', 'portrait');
        $path = tempnam(sys_get_temp_dir(), 'quamc_div_') . '.pdf';
        $pdf->save($path);

        return $path;
    }

    /**
     * Convert any uploaded file to PDF based on its extension.
     * Supported: pdf (passthrough), docx/doc, xlsx/xls, pptx, jpg/jpeg/png/gif/webp
     */
    private function convertToPdf(string $filePath, array &$tempFiles): ?string
    {
        $fullPath = storage_path('app/' . $filePath);
        if (!file_exists($fullPath)) {
            return null;
        }

        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        // Already PDF — use directly
        if ($ext === 'pdf') {
            return $fullPath;
        }

        // Office formats — convert via LibreOffice headless
        if (in_array($ext, ['doc', 'docx', 'xlsx', 'xls', 'pptx', 'ppt'])) {
            $outDir    = sys_get_temp_dir();
            $libreoffice = env('LIBREOFFICE_PATH', 'soffice');
            $escaped   = escapeshellarg($fullPath);
            $escapedDir = escapeshellarg($outDir);

            $cmd = "\"{$libreoffice}\" --headless --convert-to pdf --outdir {$escapedDir} {$escaped} 2>&1";
            exec($cmd, $output, $exitCode);

            $converted = $outDir . DIRECTORY_SEPARATOR . pathinfo($fullPath, PATHINFO_FILENAME) . '.pdf';

            if ($exitCode === 0 && file_exists($converted)) {
                $tempFiles[] = $converted;
                return $converted;
            }

            // LibreOffice failed — return null so this slot is skipped gracefully
            \Log::warning("LibreOffice conversion failed for {$fullPath}: " . implode("\n", $output));
            return null;
        }

        // Images — wrap in a simple HTML page and render via DomPDF
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $dataUri  = 'data:image/' . $ext . ';base64,' . base64_encode(file_get_contents($fullPath));
            $html     = '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">'
                      . '<img src="' . $dataUri . '" style="max-width:100%;max-height:100%;object-fit:contain;" />'
                      . '</body></html>';

            $pdf  = PDF::loadHTML($html)->setPaper('a4', 'portrait');
            $path = tempnam(sys_get_temp_dir(), 'quamc_img_') . '.pdf';
            $pdf->save($path);
            $tempFiles[] = $path;
            return $path;
        }

        // Unsupported type
        return null;
    }

    /**
     * Merge multiple PDFs into one using FPDI and return the merged file path.
     */
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
                    $tpl = $merger->importPage($i);
                    $size = $merger->getTemplateSize($tpl);

                    // Use source page orientation
                    $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                    $merger->AddPage($orientation, [$size['width'], $size['height']]);
                    $merger->useTemplate($tpl);
                }
            } catch (\Exception $e) {
                \Log::warning("FPDI could not merge PDF: {$path} — " . $e->getMessage());
                // Skip this file — don't crash the whole export
            }
        }

        $finalPath = tempnam(sys_get_temp_dir(), 'quamc_export_') . '.pdf';
        $merger->Output($finalPath, 'F');

        return $finalPath;
    }
}
