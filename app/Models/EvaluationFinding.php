<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationFinding extends Model
{
    use HasUuids;

    protected $fillable = [
        'evaluation_id',
        'rubric_criterion_id',
        'finding_type',
        'requirement_key',
        'title',
        'details',
        'score',
        'sort_order',
        'evidence',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'evidence' => 'array',
            'metadata' => 'array',
            'score' => 'decimal:2',
        ];
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function rubricCriterion(): BelongsTo
    {
        return $this->belongsTo(RubricCriterion::class);
    }
}
