<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    /**
     * Log an activity for audit trail.
     */
    protected function logActivity(string $event, $model = null, array $changes = []): void
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'event' => $event,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->id ?? null,
            'changes' => $changes,
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Log a sensitive action with detailed information.
     */
    protected function logSensitiveAction(string $action, $model, array $details = []): void
    {
        $this->logActivity(
            event: "SENSITIVE: {$action}",
            model: $model,
            changes: array_merge([
                'action' => $action,
                'timestamp' => now()->toIso8601String(),
                'user_agent' => request()->userAgent(),
            ], $details)
        );
    }
}
