<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     */
    public static function send(
        string $userId,
        string $type,
        string $message,
        ?int   $areaId = null,
        ?string $link  = null
    ): void {
        Notification::create([
            'user_id'  => $userId,
            'type'     => $type,
            'message'  => $message,
            'area_id'  => $areaId,
            'link'     => $link,
            'is_read'  => false,
        ]);
    }

    /**
     * Notify all users with the given role slug,
     * optionally scoped to a specific program.
     */
    public static function notifyRole(
        string  $roleSlug,
        string  $type,
        string  $message,
        ?int    $programId = null,
        ?int    $areaId    = null,
        ?string $link      = null
    ): void {
        $query = User::whereHas('roles', fn($q) => $q->where('slug', $roleSlug));

        if ($programId) {
            $query->where('program_id', $programId);
        }

        foreach ($query->get() as $user) {
            static::send($user->id, $type, $message, $areaId, $link);
        }
    }
}
