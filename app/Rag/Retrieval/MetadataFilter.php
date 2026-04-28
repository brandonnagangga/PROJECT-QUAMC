<?php

namespace App\Rag\Retrieval;

use App\Models\DocumentChunk;
use Illuminate\Database\Eloquent\Builder;

class MetadataFilter
{
    public function apply(Builder $query, array $filters): Builder
    {
        if (!empty($filters['chunkable_type'])) {
            $query->where('chunkable_type', $filters['chunkable_type']);
        }

        if (!empty($filters['chunkable_id'])) {
            $query->where('chunkable_id', $filters['chunkable_id']);
        }

        return $query;
    }

    public function baseQuery(): Builder
    {
        return DocumentChunk::query();
    }
}
