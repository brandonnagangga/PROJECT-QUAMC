<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A "Return for Revision" record. Replaces the old submission/approval workflow.
 *
 * - `returnable` polymorphically points to the thing that needs revision:
 *      • SubArea (top-level return on a sub-area)
 *      • AreaItem (items AND sub-items — sub-items are AreaItem rows with parent_item_id set)
 * - `sub_area_id` is always populated for fast scoping (even when targeting an item).
 * - `program_id` scopes the return to a specific program.
 * - `returned_by_role` is one of: 'dean', 'director'.
 * - Active when `resolved_at` is null.
 *
 * Resolution rules (enforced in controller):
 *   • Director-returned → only area-coordinator / program-coordinator can resolve
 *   • Dean-returned     → any role can resolve
 */
class RevisionReturn extends Model
{
    protected $fillable = [
        'returnable_type',
        'returnable_id',
        'sub_area_id',
        'program_id',
        'cycle_id',
        'returned_by',
        'returned_by_role',
        'comment',
        'resolved_at',
        'resolved_by',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function returnable(): MorphTo
    {
        return $this->morphTo();
    }

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
        return $this->belongsTo(AccreditationCycle::class, 'cycle_id');
    }

    public function returner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isActive(): bool
    {
        return $this->resolved_at === null;
    }

    public function scopeActive($query)
    {
        return $query->whereNull('resolved_at');
    }

    public function scopeResolved($query)
    {
        return $query->whereNotNull('resolved_at');
    }

    public function scopeForProgram($query, int $programId)
    {
        return $query->where('program_id', $programId);
    }
}
