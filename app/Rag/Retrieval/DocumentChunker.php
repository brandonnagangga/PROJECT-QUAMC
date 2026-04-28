<?php

namespace App\Rag\Retrieval;

use Illuminate\Support\Str;

class DocumentChunker
{
    public function chunk(string $text, array $metadata = []): array
    {
        $text = trim($text);

        if ($text === '') {
            return [];
        }

        $chunkSize = max(300, (int) config('retrieval.chunk_size', 1200));
        $overlap = max(0, min((int) config('retrieval.chunk_overlap', 200), $chunkSize - 50));
        $paragraphs = preg_split("/\n\s*\n/", $text) ?: [];

        $chunks = [];
        $buffer = '';
        $index = 0;

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);

            if ($paragraph === '') {
                continue;
            }

            $candidate = trim($buffer . "\n\n" . $paragraph);

            if ($buffer !== '' && Str::length($candidate) > $chunkSize) {
                $chunks[] = $this->makeChunk($buffer, $index++, $metadata);
                $buffer = $this->tailForOverlap($buffer, $overlap);
                $candidate = trim($buffer . "\n\n" . $paragraph);
            }

            if (Str::length($candidate) > $chunkSize) {
                foreach ($this->splitLongParagraph($candidate, $chunkSize, $overlap) as $piece) {
                    $chunks[] = $this->makeChunk($piece, $index++, $metadata);
                }

                $buffer = '';
                continue;
            }

            $buffer = $candidate;
        }

        if ($buffer !== '') {
            $chunks[] = $this->makeChunk($buffer, $index, $metadata);
        }

        return $chunks;
    }

    protected function splitLongParagraph(string $text, int $chunkSize, int $overlap): array
    {
        $pieces = [];
        $start = 0;
        $length = Str::length($text);

        while ($start < $length) {
            $piece = Str::substr($text, $start, $chunkSize);

            if (trim($piece) !== '') {
                $pieces[] = trim($piece);
            }

            $start += max(1, $chunkSize - $overlap);
        }

        return $pieces;
    }

    protected function tailForOverlap(string $text, int $overlap): string
    {
        if ($overlap === 0) {
            return '';
        }

        return trim(Str::substr($text, -1 * $overlap));
    }

    protected function makeChunk(string $content, int $index, array $metadata): array
    {
        return [
            'chunk_index' => $index,
            'content' => trim($content),
            'token_count' => count(preg_split('/\s+/', trim($content)) ?: []),
            'metadata' => $metadata,
        ];
    }
}
