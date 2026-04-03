<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAction extends Model
{
    use HasUuids;

    protected $fillable = [
        'document_id',
        'actor_id',
        'action',
        'from_status',
        'to_status',
        'comment',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'acted_at' => 'datetime',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
