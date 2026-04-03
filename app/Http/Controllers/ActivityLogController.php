<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = ActivityLog::with(['user'])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user?->name ?? 'System',
                    'event' => $log->event,
                    'model_type' => class_basename($log->model_type ?? ''),
                    'model_id' => $log->model_id,
                    'changes' => $log->changes,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->format('M j, Y H:i'),
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
        ]);
    }
}
