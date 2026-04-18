<?php

namespace App\Rag\Retrieval;

use App\Models\DocumentChunk;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class VectorStoreService
{
    public function __construct(
        protected EmbeddingService $embeddingService,
        protected MetadataFilter $metadataFilter,
    ) {}

    public function reindex(Model $chunkable, array $chunks): Collection
    {
        if (method_exists($chunkable, 'chunks')) {
            $chunkable->chunks()->delete();
        }

        return collect($chunks)->map(function (array $chunk) use ($chunkable) {
            return $chunkable->chunks()->create([
                'chunk_index' => $chunk['chunk_index'],
                'content' => $chunk['content'],
                'token_count' => $chunk['token_count'],
                'embedding' => $this->embeddingService->embedText($chunk['content']),
                'metadata' => $chunk['metadata'] ?? [],
                'extracted_from' => 'text',
            ]);
        });
    }

    public function search(string $query, array $filters = [], ?int $limit = null): Collection
    {
        $limit ??= (int) config('retrieval.top_k', 6);
        $queryVector = $this->embeddingService->embedText($query);

        return $this->metadataFilter
            ->apply($this->metadataFilter->baseQuery(), $filters)
            ->get()
            ->map(function (DocumentChunk $chunk) use ($queryVector) {
                $chunk->similarity = $this->embeddingService->cosineSimilarity($queryVector, $chunk->embedding ?? []);

                return $chunk;
            })
            ->sortByDesc('similarity')
            ->take($limit)
            ->values();
    }
}
