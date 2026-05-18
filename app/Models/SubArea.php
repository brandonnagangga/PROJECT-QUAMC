<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SubArea extends Model
{
    protected $fillable = [
        'area_id',
        'name',
        'order_number',
        'is_archived',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AreaItem::class);
    }

    public function standards(): HasMany
    {
        return $this->hasMany(Standard::class);
    }

    public function rubrics(): HasMany
    {
        return $this->hasMany(Rubric::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(SubAreaNote::class);
    }

    /** All revision returns directly on the sub-area itself. */
    public function revisionReturns(): MorphMany
    {
        return $this->morphMany(RevisionReturn::class, 'returnable');
    }

    /** All revision returns within this sub-area (sub-area + items + sub-items). */
    public function allRevisionReturns(): HasMany
    {
        return $this->hasMany(RevisionReturn::class);
    }

    /**
     * Get all 3 document slots for a specific program.
     */
    public function slotsForProgram(int $programId): array
    {
        $docs = $this->documents()
            ->where('program_id', $programId)
            ->get()
            ->keyBy('doc_type');

        return [
            'input'   => $docs->get('input'),
            'process' => $docs->get('process'),
            'outcome' => $docs->get('outcome'),
        ];
    }
}
