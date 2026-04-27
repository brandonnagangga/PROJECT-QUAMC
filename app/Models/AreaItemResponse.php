<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AreaItemResponse extends Model
{
    protected $fillable = [
        'area_item_id',
        'program_id',
        'cycle_id',
        'rating',
        'content_json',
        'content_text',
        'status',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'rating'       => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────

    public function item(): BelongsTo
    {
        return $this->belongsTo(AreaItem::class, 'area_item_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(AccreditationCycle::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function files(): HasMany
    {
        return $this->hasMany(AreaItemFile::class, 'response_id');
    }

    // ── Helpers ────────────────────────────────────────────────

    /**
     * Contribution of this item's rating to the sub-area weighted score.
     * Input=20%, Process=30%, Outcome=50%.
     */
    public function weightedContribution(): float
    {
        if ($this->rating === null) return 0.0;

        $weights = ['input' => 0.20, 'process' => 0.30, 'outcome' => 0.50];
        $ipoType = $this->item?->ipo_type ?? 'input';
        return round($this->rating * ($weights[$ipoType] ?? 0.20), 4);
    }
}
