<?php

namespace App\Services;

class PdfTextExtractorService
{
    /**
     * Extract text from a PDF stored in Laravel storage.
     * Returns ['text' => string|null, 'extractable' => bool]
     */
    public function extractFromStoragePath(string $relativePath): array
    {
        return $this->extractFromPath(storage_path('app/' . $relativePath));
    }

    public function extractFromPath(string $absolutePath): array
    {
        if (!file_exists($absolutePath)) {
            return ['text' => null, 'extractable' => false];
        }

        if (!class_exists(\Spatie\PdfToText\Pdf::class)) {
            return ['text' => null, 'extractable' => false];
        }

        try {
            // Use bundled Windows binary if available (for local dev)
            $winBinPath = base_path('bin/poppler/bin/pdftotext.exe');
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' && file_exists($winBinPath)) {
                $pdfExtractor = new \Spatie\PdfToText\Pdf($winBinPath);
            } else {
                $pdfExtractor = new \Spatie\PdfToText\Pdf();
            }

            // Extract with -layout to preserve column/reading order much better than smalot
            $text = $pdfExtractor->setPdf($absolutePath)
                ->setOptions(['-layout'])
                ->text();
            
            $text = trim($text);

            if (empty($text)) {
                return ['text' => null, 'extractable' => false];
            }

            // ── 1. Keep full unicode (emojis, arrows, etc.) ──────────────────────
            // REMOVED the strip non-printable regex — it was killing emojis/arrows

            // ── 2. Normalize horizontal whitespace but preserve layout spacing ───
            // Only collapse truly excessive spaces (5+), keep table-like spacing
            $text = preg_replace('/[ \t]{5,}/', '    ', $text);

            // ── 3. Collapse runs of 3+ newlines to a paragraph break ─────────────
            $text = preg_replace('/\n{3,}/', "\n\n", $text);

            $text = trim($text);

            // ── 4. Raise the cap significantly ───────────────────────────────────
            // 2500 chars was too small for multi-page docs like bug reports
            if (mb_strlen($text) > 10000) {
                $text = mb_substr($text, 0, 10000) . "\n\n[... content continues in attached file ...]";
            }

            return ['text' => $text, 'extractable' => true];
        } catch (\Exception $e) {
            \Log::error('PDF Extraction Error: ' . $e->getMessage());
            return ['text' => null, 'extractable' => false];
        }
    }


    /**
     * Convert an image file to a base64 data URI for inline embedding in DomPDF.
     */
    public function imageToDataUri(string $absolutePath, string $mimeType): ?string
    {
        if (!file_exists($absolutePath)) return null;
        $data = @file_get_contents($absolutePath);
        if ($data === false) return null;
        return 'data:' . $mimeType . ';base64,' . base64_encode($data);
    }
}
