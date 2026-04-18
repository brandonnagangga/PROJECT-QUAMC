<?php

namespace App\Rag\Retrieval;

use App\Models\DocumentVersion;
use App\Models\Standard;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class Retriever
{
    public function __construct(
        protected VectorStoreService $vectorStore,
    ) {}

    /**
     * Retrieve only the most relevant standard chunks for the submitted document.
     * This keeps the augmentation layer compact and grounded in the reference.
     */
    public function retrieveRelevantStandardChunks(Standard $standard, DocumentVersion $documentVersion): Collection
    {
        $query = trim(Str::limit($documentVersion->extracted_text ?? '', 3000, ''));

        if ($query === '') {
            $query = $documentVersion->document?->title ?? $standard->title;
        }

        return $this->vectorStore->search($query, [
            'chunkable_type' => Standard::class,
            'chunkable_id' => $standard->id,
        ]);
    }
}
