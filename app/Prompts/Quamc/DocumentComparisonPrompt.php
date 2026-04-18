<?php

namespace App\Prompts\Quamc;

class DocumentComparisonPrompt
{
    public function system(): string
    {
        return 'Compare a submitted document against a reference standard. Return JSON only. Use neutral language. Do not assign pass/fail decisions or invent scoring rules.';
    }

    public function user(array $payload): string
    {
        return json_encode([
            'task' => 'Compare submitted evidence against the provided standard and rubric requirements.',
            'required_output' => [
                'matched_requirements',
                'missing_requirements',
                'unclear_items',
                'extracted_sections',
                'neutral_summary',
            ],
            'standard' => $payload['standard'] ?? [],
            'submitted_document' => $payload['submitted_document'] ?? [],
            'requirements' => $payload['requirements'] ?? [],
            'retrieved_chunks' => $payload['retrieved_chunks'] ?? [],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
