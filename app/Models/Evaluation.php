<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluation extends Model
{
    use HasUuids;

    protected $fillable = [
        'document_id',
        'document_version_id',
        'standard_id',
        'rubric_id',
        'requested_by',
        'status',
        'matched_requirements_count',
        'missing_requirements_count',
        'unclear_items_count',
        'total_score',
        'max_score',
        'status_label',
        'neutral_summary',
        'retrieval_context',
        'ai_response',
        'scoring_breakdown',
        'error_message',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'retrieval_context' => 'array',
            'ai_response' => 'array',
            'scoring_breakdown' => 'array',
            'completed_at' => 'datetime',
            'total_score' => 'decimal:2',
            'max_score' => 'decimal:2',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function documentVersion(): BelongsTo
    {
        return $this->belongsTo(DocumentVersion::class);
    }

    public function standard(): BelongsTo
    {
        return $this->belongsTo(Standard::class);
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(Rubric::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function findings(): HasMany
    {
        return $this->hasMany(EvaluationFinding::class)->orderBy('sort_order');
    }
}
