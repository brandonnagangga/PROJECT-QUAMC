<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubAreaNoteReply extends Model
{
    protected $table = 'sub_area_note_replies';

    protected $fillable = ['sub_area_id', 'program_id', 'user_id', 'message'];

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
