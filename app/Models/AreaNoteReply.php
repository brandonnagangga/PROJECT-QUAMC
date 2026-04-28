<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AreaNoteReply extends Model
{
    protected $fillable = [
        'area_note_id',
        'user_id',
        'message',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(AreaNote::class, 'area_note_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
