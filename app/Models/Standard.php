<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Standard extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'code',
        'description',
        'area_id',
        'sub_area_id',
        'doc_type',
        'rubric_id',
        'uploaded_by',
        'file_path',
        'original_filename',
        'mime_type',
        'extracted_text',
        'extracted_at',
        'index_status',
        'index_error',
        'metadata',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_active' => 'boolean',
            'extracted_at' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(Rubric::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function chunks(): MorphMany
    {
        return $this->morphMany(DocumentChunk::class, 'chunkable');
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }
}
