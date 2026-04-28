<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class DocumentVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'document_id',
        'uploaded_by',
        'version_number',
        'file_path',
        'original_filename',
        'file_size_bytes',
        'mime_type',
        'notes',
        'scan_status',
        'extracted_text',
        'extracted_at',
        'index_status',
        'index_error',
    ];

    protected function casts(): array
    {
        return [
            'extracted_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
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

    /**
     * Get human-readable file size.
     */
    public function fileSizeFormatted(): string
    {
        $bytes = $this->file_size_bytes;
        if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
        return $bytes . ' bytes';
    }
}
