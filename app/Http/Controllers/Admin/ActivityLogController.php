<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->loadMissing('roles');
        $isAdmin = $user->hasRole('admin');

        $activityStats = ActivityLog::query()
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(*) as activity_count, MAX(created_at) as latest_activity_at')
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $usersQuery = User::with('roles')->orderBy('name');
        if (!$isAdmin) {
            $usersQuery->where('id', $user->id);
        }

        $users = $usersQuery
            ->get()
            ->map(function (User $activityUser) use ($activityStats) {
                $stats = $activityStats->get($activityUser->id);
                $latest = $stats?->latest_activity_at
                    ? Carbon::parse($stats->latest_activity_at)
                    : null;

                return [
                    'id' => $activityUser->id,
                    'name' => $activityUser->name,
                    'email' => $activityUser->email,
                    'role' => $activityUser->roles->first()?->name ?? 'User',
                    'role_slug' => $activityUser->roles->first()?->slug ?? '',
                    'is_active' => $activityUser->is_active,
                    'activity_count' => (int) ($stats?->activity_count ?? 0),
                    'latest_activity' => $latest?->format('M j, Y H:i'),
                    'latest_activity_ago' => $latest?->diffForHumans(),
                    'latest_activity_sort' => $latest?->getTimestamp() ?? 0,
                ];
            })
            ->sortByDesc('latest_activity_sort')
            ->values();

        $selectedUserId = $this->cleanText((string) $request->query('user_id', ''), 80);
        if (!$isAdmin) {
            $selectedUserId = (string) $user->id;
        }
        $selectedUser = null;
        $logs = collect();

        if ($selectedUserId) {
            $selectedUser = $users->firstWhere('id', $selectedUserId);
            abort_unless($selectedUser, 404);

            $logs = ActivityLog::with(['user'])
                ->where('user_id', $selectedUserId)
                ->orderByDesc('created_at')
                ->limit(500)
                ->get()
                ->map(fn(ActivityLog $log) => $this->formatLog($log));
        }

        return Inertia::render('Logs/Index', [
            'users' => $users->map(fn(array $activityUser) => collect($activityUser)->except('latest_activity_sort')->all()),
            'logs' => $logs,
            'selectedUser' => $selectedUser ? collect($selectedUser)->except('latest_activity_sort')->all() : null,
            'selectedUserId' => $selectedUser['id'] ?? null,
            'currentUserId' => $user->id,
        ]);
    }

    public function storeClientEvent(Request $request)
    {
        $data = $request->validate([
            'event' => ['required', 'string', Rule::in([
                'ui.page_viewed',
                'ui.menu_navigated',
                'ui.button_clicked',
                'ui.link_clicked',
            ])],
            'target_label' => ['nullable', 'string', 'max:140'],
            'target_role' => ['nullable', 'string', 'max:80'],
            'path' => ['nullable', 'string', 'max:255'],
            'href' => ['nullable', 'string', 'max:255'],
            'page_title' => ['nullable', 'string', 'max:140'],
        ]);

        $path = $this->normalizeClientPath($request, $data['path'] ?? null);
        $href = $this->normalizeClientPath($request, $data['href'] ?? null);

        ActivityLogService::log($request->user(), $data['event'], null, [
            'target_label' => $this->cleanText($data['target_label'] ?? 'Unlabeled control', 140),
            'target_role' => $this->cleanText($data['target_role'] ?? 'interface', 80),
            'path' => $path,
            'href' => $href,
            'page_title' => $this->cleanText($data['page_title'] ?? null, 140),
        ], $request->ip());

        return response()->noContent();
    }

    private function cleanText(?string $value, int $limit): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = preg_replace('/\s+/u', ' ', trim($value)) ?? '';
        if ($value === '') {
            return null;
        }

        return mb_substr($value, 0, $limit);
    }

    private function formatLog(ActivityLog $log): array
    {
        $changes = is_array($log->changes) ? $log->changes : json_decode($log->changes ?? '{}', true);

        return [
            'id' => $log->id,
            'user_id' => $log->user_id,
            'user_name' => $log->user?->name ?? 'System',
            'event' => $log->event,
            'description' => $changes['description'] ?? null,
            'model_type' => class_basename($log->model_type ?? ''),
            'model_id' => $log->model_id,
            'changes' => $changes,
            'target_label' => $changes['target_label'] ?? null,
            'target_role' => $changes['target_role'] ?? null,
            'path' => $changes['path'] ?? null,
            'href' => $changes['href'] ?? null,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at->format('M j, Y H:i'),
            'time_ago' => $log->created_at->diffForHumans(),
        ];
    }

    private function normalizeClientPath(Request $request, ?string $value): ?string
    {
        $value = $this->cleanText($value, 255);
        if ($value === null) {
            return null;
        }

        $parts = parse_url($value);
        if ($parts === false) {
            return null;
        }

        if (isset($parts['host']) && $parts['host'] !== $request->getHost()) {
            return null;
        }

        $path = $parts['path'] ?? $value;
        if (!str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return null;
        }

        $query = isset($parts['query']) ? '?' . $parts['query'] : '';

        return mb_substr($path . $query, 0, 255);
    }
}
