<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AreaItem extends Model
{
    protected $fillable = ['sub_area_id', 'name', 'description', 'order_number', 'is_required', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function subArea(): BelongsTo
    {
        return $this->belongsTo(SubArea::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
