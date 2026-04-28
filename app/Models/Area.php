<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\AreaChecklist;

class Area extends Model
{
    protected $fillable = [
        'name',
        'order_number',
        'is_archived',
        'created_by',
        'deadline_at',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'deadline_at' => 'datetime',
        ];
    }

    // Areas are global — no program() relationship

    public function subAreas(): HasMany
    {
        return $this->hasMany(SubArea::class)->orderBy('order_number');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AreaAssignment::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(AreaChecklist::class)->orderBy('order_number');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get completion % for this area across a given program.
     * A slot is "complete" when its document status is approved.
     */
    public function completionPercentage(int $programId): float
    {
        $subAreaIds = $this->subAreas()->pluck('id');
        $totalSlots = $subAreaIds->count() * 3; // always 3 slots per sub-area

        if ($totalSlots === 0) return 0;

        $approvedSlots = Document::whereIn('sub_area_id', $subAreaIds)
            ->where('program_id', $programId)
            ->where('status', 'approved')
            ->count();

        return round(($approvedSlots / $totalSlots) * 100);
    }
}
