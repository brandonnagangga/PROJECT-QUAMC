<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

class Program extends Model
{
    protected $fillable = ['name', 'code', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /**
     * Areas are GLOBAL — all programs share the same area structure.
     * This returns all global areas (not filtered by program_id).
     *
     * Note: this is NOT a real Eloquent HasMany relationship.
     * Use Area::all() or Area::orderBy('order_number')->get() directly
     * in new code. This accessor exists for backward compatibility.
     */
    public function getAreasAttribute(): Collection
    {
        return Area::orderBy('order_number')->get();
    }

    /**
     * Documents uploaded under this program.
     */
    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
