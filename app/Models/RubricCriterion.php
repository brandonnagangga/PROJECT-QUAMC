<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RubricCriterion extends Model
{
    use HasUuids;

    protected $fillable = [
        'rubric_id',
        'code',
        'title',
        'description',
        'weight',
        'sort_order',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'weight' => 'decimal:2',
        ];
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(Rubric::class);
    }

    public function findings(): HasMany
    {
        return $this->hasMany(EvaluationFinding::class);
    }
}
