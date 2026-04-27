<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with(['user'])
            ->orderByDesc('created_at')
            ->limit(300);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT(changes, '$.description')) LIKE ?", ["%{$search}%"]);
            });
        }

        $logs = $query->get()->map(function ($log) {
            $changes     = is_array($log->changes) ? $log->changes : json_decode($log->changes ?? '{}', true);
            $description = $changes['description'] ?? null;

            return [
                'id'          => $log->id,
                'user_name'   => $log->user?->name ?? 'System',
                'event'       => $log->event,
                'description' => $description,
                'model_type'  => class_basename($log->model_type ?? ''),
                'model_id'    => $log->model_id,
                'changes'     => $changes,
                'ip_address'  => $log->ip_address,
                'created_at'  => $log->created_at->format('M j, Y H:i'),
                'time_ago'    => $log->created_at->diffForHumans(),
            ];
        });

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
        ]);
    }
}
