<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AreaItemFile extends Model
{
    protected $fillable = [
        'area_item_id',
        'response_id',
        'program_id',
        'cycle_id',
        'uploaded_by',
        'original_filename',
        'file_path',
        'file_size_bytes',
        'mime_type',
        'scan_status',
    ];

    // ── Relationships ──────────────────────────────────────────

    public function item(): BelongsTo
    {
        return $this->belongsTo(AreaItem::class, 'area_item_id');
    }

    public function response(): BelongsTo
    {
        return $this->belongsTo(AreaItemResponse::class, 'response_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ── Helpers ────────────────────────────────────────────────

    public function fileSizeFormatted(): string
    {
        $bytes = $this->file_size_bytes;
        if ($bytes >= 1_048_576)  return round($bytes / 1_048_576, 1) . ' MB';
        if ($bytes >= 1_024)      return round($bytes / 1_024, 1)     . ' KB';
        return $bytes . ' B';
    }
}
