<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AreaItem extends Model
{
    protected $fillable = [
        'sub_area_id',
        'ipo_type',
        'parent_item_id',
        'label',
        'order_number',
        'is_archived',
    ];

    protected function casts(): array
    {
        return ['is_archived' => 'boolean'];
    }

    // ── Relationships ──────────────────────────────────────────

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    /** The parent item (null if this IS a top-level item). */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(AreaItem::class, 'parent_item_id');
    }

    /** Direct children (sub-items) in order. */
    public function children(): HasMany
    {
        return $this->hasMany(AreaItem::class, 'parent_item_id')->orderBy('order_number');
    }

    /** Narrative + rating responses (one per program/cycle). */
    public function responses(): HasMany
    {
        return $this->hasMany(AreaItemResponse::class);
    }

    /** Supporting evidence files across all programs. */
    public function files(): HasMany
    {
        return $this->hasMany(AreaItemFile::class);
    }

    /** Revision returns targeting this item (or sub-item). */
    public function revisionReturns()
    {
        return $this->morphMany(RevisionReturn::class, 'returnable');
    }

    // ── Helpers ────────────────────────────────────────────────

    public function isSubItem(): bool
    {
        return $this->parent_item_id !== null;
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_item_id');
    }

    public function scopeForIpoType($query, string $type)
    {
        return $query->where('ipo_type', $type);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }
}
