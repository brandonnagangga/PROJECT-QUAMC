<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubArea extends Model
{
    protected $fillable = [
        'area_id',
        'name',
        'order_number',
        'is_archived',
        'submission_status',
        'submitted_by_dean_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'submitted_by_dean_at' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all 3 document slots for a specific program.
     * Returns: ['input' => Document|null, 'process' => Document|null, 'outcome' => Document|null]
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
