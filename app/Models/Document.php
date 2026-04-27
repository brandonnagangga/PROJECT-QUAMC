<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasUuids;

    protected $fillable = [
        'sub_area_id',
        'program_id',
        'cycle_id',
        'doc_type',     // input | process | outcome
        'uploaded_by',
        'title',
        'status',
        'approval_status',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'current_version',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(AccreditationCycle::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class)->orderByDesc('version_number');
    }

    public function workflowActions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class)->orderByDesc('acted_at');
    }

    public function latestVersion(): ?DocumentVersion
    {
        return $this->versions()->first();
    }

    /**
     * Check if the given user is the original uploader.
     */
    public function isUploadedBy(string $userId): bool
    {
        return $this->uploaded_by === $userId;
    }
}
