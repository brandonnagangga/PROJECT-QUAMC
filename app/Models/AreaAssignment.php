<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AreaAssignment extends Model
{
    protected $fillable = ['user_id', 'area_id', 'assigned_by', 'role_type', 'academic_year'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
