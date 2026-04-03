<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccreditationCycle extends Model
{
    protected $fillable = [
        'name',
        'academic_year',
        'start_date',
        'end_date',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'cycle_id');
    }

    /**
     * Get the currently active cycle.
     */
    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }

    /**
     * Set this cycle as active (deactivate all others).
     */
    public function setAsActive(): void
    {
        static::where('is_active', true)->update(['is_active' => false]);
        $this->update(['is_active' => true]);
    }
}
