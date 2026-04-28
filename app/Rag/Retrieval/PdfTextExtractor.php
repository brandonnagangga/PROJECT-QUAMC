<?php

namespace App\Rag\Retrieval;

use Illuminate\Support\Facades\Process;

class PdfTextExtractor
{
    /**
     * Extract plain text from a stored file.
     *
     * The retrieval layer should only turn files into searchable text.
     * It does not score, summarize, or decide evaluation outcomes.
     */
    public function extractFromPath(string $path, ?string $mimeType = null): string
    {
        if (!is_file($path)) {
            return '';
        }

        if (str_starts_with((string) $mimeType, 'text/')) {
            return trim((string) file_get_contents($path));
        }

        if ($mimeType !== 'application/pdf' && strtolower(pathinfo($path, PATHINFO_EXTENSION)) !== 'pdf') {
            return '';
        }

        foreach ($this->candidateCommands($path) as $command) {
            try {
                $result = Process::timeout(90)->run($command);

                if ($result->successful()) {
                    $text = trim($result->output());

                    if ($text !== '') {
                        return $this->normalizeWhitespace($text);
                    }
                }
            } catch (\Throwable) {
                // Try the next extractor when an external binary is not available.
            }
        }

        return '';
    }

    protected function candidateCommands(string $path): array
    {
        $escapedPath = '"' . str_replace('"', '\"', $path) . '"';

        return [
            "pdftotext -layout -nopgbrk {$escapedPath} -",
            "mutool draw -F txt -o - {$escapedPath}",
        ];
    }

    protected function normalizeWhitespace(string $text): string
    {
        $text = preg_replace("/\r\n?/", "\n", $text) ?? $text;
        $text = preg_replace("/[ \t]+/", ' ', $text) ?? $text;
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        return trim($text);
    }
}
