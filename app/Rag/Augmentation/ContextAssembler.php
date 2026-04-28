<?php

namespace App\Rag\Augmentation;

use App\Models\DocumentVersion;
use App\Models\Evaluation;
use App\Models\Standard;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ContextAssembler
{
    /**
     * The augmentation layer translates retrieval results into a compact,
     * structured comparison payload for the AI layer.
     */
    public function assemble(
        Evaluation $evaluation,
        Standard $standard,
        DocumentVersion $documentVersion,
        Collection $retrievedChunks
    ): array {
        $requirements = $this->requirementsFromRubric($standard);

        return [
            'evaluation_id' => $evaluation->id,
            'standard' => [
                'id' => $standard->id,
                'title' => $standard->title,
                'code' => $standard->code,
                'doc_type' => $standard->doc_type,
            ],
            'submitted_document' => [
                'id' => $documentVersion->document_id,
                'version_id' => $documentVersion->id,
                'title' => $documentVersion->document?->title,
                'excerpt' => Str::limit($documentVersion->extracted_text ?? '', 5000, ''),
            ],
            'requirements' => $requirements,
            'retrieved_chunks' => $retrievedChunks->map(fn ($chunk) => [
                'chunk_index' => $chunk->chunk_index,
                'content' => $chunk->content,
                'similarity' => round((float) ($chunk->similarity ?? 0), 4),
            ])->values()->all(),
        ];
    }

    protected function requirementsFromRubric(Standard $standard): array
    {
        $criteria = $standard->rubric?->criteria ?? collect();

        if ($criteria->isNotEmpty()) {
            return $criteria->map(fn ($criterion) => [
                'key' => $criterion->code ?: $criterion->id,
                'title' => $criterion->title,
                'description' => $criterion->description,
                'weight' => (float) $criterion->weight,
            ])->values()->all();
        }

        $paragraphs = collect(preg_split("/\n\s*\n/", $standard->extracted_text ?? '') ?: [])
            ->filter()
            ->take(8)
            ->values();

        $weight = round(100 / max(1, $paragraphs->count()), 2);

        return $paragraphs->map(fn ($paragraph, $index) => [
            'key' => 'STD-' . ($index + 1),
            'title' => 'Reference requirement ' . ($index + 1),
            'description' => Str::limit(trim($paragraph), 240, ''),
            'weight' => $weight,
        ])->all();
    }
}
