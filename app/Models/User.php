<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'program_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    public function areaAssignments(): HasMany
    {
        return $this->hasMany(AreaAssignment::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // ── Role Helpers ──

    public function hasRole(string|array $slug): bool
    {
        if (is_array($slug)) {
            return $this->hasAnyRole($slug);
        }

        return $this->roles->contains('slug', $slug);
    }

    public function hasAnyRole(array $slugs): bool
    {
        return $this->roles->whereIn('slug', $slugs)->isNotEmpty();
    }

    public function primaryRole(): ?Role
    {
        return $this->roles->first();
    }

    public function unreadNotificationsCount(): int
    {
        return $this->notifications()->where('is_read', false)->count();
    }
}
