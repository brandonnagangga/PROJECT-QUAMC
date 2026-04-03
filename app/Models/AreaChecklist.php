<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AreaChecklist extends Model
{
    protected $fillable = [
        'area_id',
        'evidence_type',
        'description',
        'is_required',
        'order_number',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_completed' => 'boolean',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
