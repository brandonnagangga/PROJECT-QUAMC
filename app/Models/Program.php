<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;

class Program extends Model
{
    protected $fillable = ['name', 'code', 'logo_path', 'is_active'];


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

    /**
     * Returns the program logo as a base64 data URI for DomPDF embedding.
     * Returns null if no logo is set or file doesn't exist.
     */
    public function logoDataUri(): ?string
    {
        if (!$this->logo_path) return null;
        // Try private disk first, then legacy path
        $path = storage_path('app/private/' . $this->logo_path);
        if (!file_exists($path)) {
            $path = storage_path('app/' . $this->logo_path);
        }
        if (!file_exists($path)) return null;
        $data = @file_get_contents($path);
        if (!$data) return null;
        $mime = mime_content_type($path) ?: 'image/png';
        return 'data:' . $mime . ';base64,' . base64_encode($data);
    }
}
