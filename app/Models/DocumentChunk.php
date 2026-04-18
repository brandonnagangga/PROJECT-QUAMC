<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DocumentChunk extends Model
{
    use HasUuids;

    protected $fillable = [
        'chunkable_type',
        'chunkable_id',
        'chunk_index',
        'content',
        'token_count',
        'embedding',
        'metadata',
        'extracted_from',
    ];

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
            'metadata' => 'array',
        ];
    }

    public function chunkable(): MorphTo
    {
        return $this->morphTo();
    }
}
