<?php

namespace App\Rag\AI;

class StructuredOutputValidator
{
    public function validateComparisonResult(array $payload): array
    {
        return [
            'matched_requirements' => $this->normalizeItems($payload['matched_requirements'] ?? []),
            'missing_requirements' => $this->normalizeItems($payload['missing_requirements'] ?? []),
            'unclear_items' => $this->normalizeItems($payload['unclear_items'] ?? []),
            'extracted_sections' => array_values($payload['extracted_sections'] ?? []),
            'neutral_summary' => (string) ($payload['neutral_summary'] ?? ''),
        ];
    }

    protected function normalizeItems(array $items): array
    {
        return collect($items)
            ->map(function ($item) {
                return [
                    'requirement_key' => $item['requirement_key'] ?? null,
                    'title' => $item['title'] ?? 'Untitled finding',
                    'details' => $item['details'] ?? null,
                    'evidence' => $item['evidence'] ?? [],
                ];
            })
            ->values()
            ->all();
    }
}
