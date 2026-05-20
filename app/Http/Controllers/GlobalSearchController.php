<?php

namespace App\Http\Controllers;

use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\Document;
use App\Models\Program;
use App\Models\Standard;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

class GlobalSearchController extends Controller
{
    private const MIN_QUERY_LENGTH = 2;
    private const MAX_QUERY_LENGTH = 80;
    private const MAX_TOKENS = 5;
    private const CANDIDATE_LIMIT = 16;
    private const RESULT_LIMIT = 12;
    private const RECENT_LIMIT = 3;

    public function index(Request $request)
    {
        $query = $this->normalizeQuery((string) $request->query('q', ''));

        try {
            $user = $request->user()?->loadMissing('roles');
            $role = $user?->roles->first()?->slug ?? '';

            if (mb_strlen($query) < self::MIN_QUERY_LENGTH) {
                return response()->json([
                    'mode' => 'recent',
                    'results' => $this->serializeResults($this->recentResults($user, $role)),
                ]);
            }

            $tokens = $this->tokenize($query);
            if ($tokens->isEmpty()) {
                return response()->json([
                    'mode' => 'recent',
                    'results' => $this->serializeResults($this->recentResults($user, $role)),
                ]);
            }

            $results = collect()
                ->merge($this->quickLinks($query, $tokens, $role))
                ->merge($this->documents($query, $tokens, $user, $role))
                ->merge($this->programs($query, $tokens, $user, $role))
                ->merge($this->areas($query, $tokens, $user, $role))
                ->merge($this->subAreas($query, $tokens, $user, $role))
                ->merge($this->standards($query, $tokens, $role))
                ->merge($this->users($query, $tokens, $user, $role))
                ->merge($this->cycles($query, $tokens, $role))
                ->sortByDesc('score')
                ->take(self::RESULT_LIMIT)
                ->values();

            return response()->json([
                'mode' => 'search',
                'results' => $this->serializeResults($results),
            ]);
        } catch (Throwable $exception) {
            Log::warning('Global search failed', [
                'query' => $query,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'results' => [],
                'message' => 'Search is temporarily unavailable.',
            ]);
        }
    }

    private function normalizeQuery(string $query): string
    {
        $query = preg_replace('/\s+/u', ' ', trim($query)) ?? '';

        return mb_substr($query, 0, self::MAX_QUERY_LENGTH);
    }

    private function tokenize(string $query): Collection
    {
        return collect(preg_split('/\s+/u', mb_strtolower($query)) ?: [])
            ->map(fn(string $token) => trim($token))
            ->filter(fn(string $token) => mb_strlen($token) >= self::MIN_QUERY_LENGTH)
            ->unique()
            ->take(self::MAX_TOKENS)
            ->values();
    }

    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }

    private function likeTerm(string $token): string
    {
        return '%' . $this->escapeLike($token) . '%';
    }

    private function applyTokenSearch($query, array $columns, Collection $tokens): void
    {
        $query->where(function ($builder) use ($columns, $tokens) {
            foreach ($tokens as $token) {
                foreach ($columns as $column) {
                    $builder->orWhere($column, 'like', $this->likeTerm($token));
                }
            }
        });
    }

    private function score(string $query, Collection $tokens, array $fields, int $priority = 0): int
    {
        $score = $priority;
        $normalizedQuery = mb_strtolower($query);

        foreach ($fields as $index => $field) {
            $text = mb_strtolower(preg_replace('/\s+/u', ' ', trim((string) $field)) ?? '');
            if ($text === '') {
                continue;
            }

            $weight = max(1, 4 - $index);

            if ($text === $normalizedQuery) {
                $score += 100 * $weight;
            } elseif (str_starts_with($text, $normalizedQuery)) {
                $score += 70 * $weight;
            } elseif (str_contains($text, $normalizedQuery)) {
                $score += 36 * $weight;
            }

            foreach ($tokens as $token) {
                if (str_starts_with($text, $token)) {
                    $score += 14 * $weight;
                } elseif (str_contains($text, $token)) {
                    $score += 7 * $weight;
                }
            }
        }

        return $score;
    }

    private function canViewAll(string $role): bool
    {
        return in_array($role, ['admin', 'director'], true);
    }

    private function canSearchAreas(string $role): bool
    {
        return in_array($role, ['director', 'dean', 'program-coordinator', 'area-coordinator'], true);
    }

    private function canSearchPrograms(string $role): bool
    {
        return in_array($role, ['admin', 'director', 'dean'], true);
    }

    private function canSearchReports(string $role): bool
    {
        return in_array($role, ['admin', 'director', 'dean'], true);
    }

    private function canSearchStandards(string $role): bool
    {
        return in_array($role, ['admin', 'director'], true);
    }

    private function canSearchUsers(string $role): bool
    {
        return in_array($role, ['admin', 'dean'], true);
    }

    private function canSearchCycles(string $role): bool
    {
        return in_array($role, ['admin', 'director'], true);
    }

    private function serializeResults(Collection $results): Collection
    {
        return $results
            ->map(fn(array $result) => collect($result)->except(['score', 'keywords', 'recent_at'])->all())
            ->values();
    }

    private function assignedAreaIds(?User $user, string $role): Collection
    {
        if (!$user || !in_array($role, ['area-coordinator', 'program-coordinator'], true)) {
            return collect();
        }

        return $user->areaAssignments()->pluck('area_id')->unique()->values();
    }

    private function scopeDocuments($query, ?User $user, string $role): void
    {
        if (!$user) {
            return;
        }

        if (in_array($role, ['dean', 'program-coordinator', 'area-coordinator'], true)) {
            if (!$user->program_id) {
                $query->whereRaw('1 = 0');
                return;
            }

            $query->where('program_id', $user->program_id);
        }

        $assignedAreaIds = $this->assignedAreaIds($user, $role);
        if (in_array($role, ['area-coordinator', 'program-coordinator'], true) && $assignedAreaIds->isEmpty()) {
            $query->whereRaw('1 = 0');
            return;
        }

        if ($assignedAreaIds->isNotEmpty()) {
            $query->whereHas('subArea', fn($subArea) => $subArea->whereIn('area_id', $assignedAreaIds));
        }
    }

    private function quickLinks(string $query, Collection $tokens, string $role): Collection
    {
        $links = [
            ['title' => 'Dashboard', 'type' => 'page', 'href' => route('dashboard', [], false), 'keywords' => 'dashboard overview home'],
            ['title' => 'Documents', 'type' => 'page', 'href' => route('documents.index', [], false), 'keywords' => 'documents files evidence uploads'],
        ];

        if ($this->canSearchAreas($role)) {
            $links[] = ['title' => 'Areas', 'type' => 'page', 'href' => route('areas.index', [], false), 'keywords' => 'areas sub areas evidence tree'];
        }

        if ($this->canSearchPrograms($role)) {
            $links[] = ['title' => 'Programs', 'type' => 'page', 'href' => route('programs.index', [], false), 'keywords' => 'programs courses accreditation'];
        }

        if ($this->canSearchReports($role)) {
            $links[] = ['title' => 'Reports', 'type' => 'page', 'href' => route('reports.readiness', [], false), 'keywords' => 'reports readiness export'];
        }

        if ($this->canSearchStandards($role)) {
            $links[] = ['title' => 'Standards', 'type' => 'page', 'href' => route('standards.index', [], false), 'keywords' => 'standards references rubrics'];
        }

        if ($this->canSearchCycles($role)) {
            $links[] = ['title' => 'Accreditation Cycles', 'type' => 'page', 'href' => route('cycles.index', [], false), 'keywords' => 'cycles academic year active'];
            $links[] = ['title' => 'Activity Logs', 'type' => 'page', 'href' => route('logs.index', [], false), 'keywords' => 'activity logs audit history'];
        }

        if ($this->canSearchUsers($role)) {
            $links[] = ['title' => 'Users', 'type' => 'page', 'href' => route('users.index', [], false), 'keywords' => 'users accounts roles'];
        }

        return collect($links)
            ->map(function (array $link) use ($query, $tokens) {
                $link['score'] = $this->score($query, $tokens, [$link['title'], $link['keywords']], 3);
                return $link;
            })
            ->filter(fn(array $link) => $link['score'] >= 18)
            ->values();
    }

    private function recentResults(?User $user, string $role): Collection
    {
        return collect()
            ->merge($this->recentDocuments($user, $role))
            ->merge($this->recentPrograms($user, $role))
            ->merge($this->recentAreas($user, $role))
            ->merge($this->recentSubAreas($user, $role))
            ->merge($this->recentStandards($role))
            ->merge($this->recentUsers($user, $role))
            ->merge($this->recentCycles($role))
            ->sortByDesc(fn(array $result) => $result['recent_at'] ?? 0)
            ->take(self::RECENT_LIMIT)
            ->values();
    }

    private function recentDocuments(?User $user, string $role): Collection
    {
        $documents = Document::query()
            ->with(['program:id,code,name', 'subArea:id,name,area_id', 'subArea.area:id,name'])
            ->select(['id', 'title', 'doc_type', 'status', 'program_id', 'sub_area_id', 'updated_at']);

        $this->scopeDocuments($documents, $user, $role);

        return $documents
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(Document $document) => [
                'id' => 'recent-document-' . $document->id,
                'title' => $document->title,
                'subtitle' => trim(($document->program?->code ?? 'Document') . ' • ' . ($document->subArea?->name ?? ucfirst($document->doc_type ?? 'Evidence'))),
                'type' => 'document',
                'href' => route('documents.show', $document->id, false),
                'recent_at' => $document->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentPrograms(?User $user, string $role): Collection
    {
        if (!$this->canSearchPrograms($role)) {
            return collect();
        }

        if (!$this->canViewAll($role) && !$user?->program_id) {
            return collect();
        }

        return Program::query()
            ->select(['id', 'name', 'code', 'is_active', 'updated_at'])
            ->where('is_active', true)
            ->when(
                !$this->canViewAll($role) && $user?->program_id,
                fn($builder) => $builder->where('id', $user->program_id)
            )
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(Program $program) => [
                'id' => 'recent-program-' . $program->id,
                'title' => "{$program->code} • {$program->name}",
                'subtitle' => 'Program',
                'type' => 'program',
                'href' => route('programs.show', $program->id, false),
                'recent_at' => $program->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentAreas(?User $user, string $role): Collection
    {
        if (!$this->canSearchAreas($role)) {
            return collect();
        }

        $assignedAreaIds = $this->assignedAreaIds($user, $role);
        if (in_array($role, ['area-coordinator', 'program-coordinator'], true) && $assignedAreaIds->isEmpty()) {
            return collect();
        }

        return Area::query()
            ->select(['id', 'name', 'updated_at'])
            ->where('is_archived', false)
            ->when($assignedAreaIds->isNotEmpty(), fn($builder) => $builder->whereIn('id', $assignedAreaIds))
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(Area $area) => [
                'id' => 'recent-area-' . $area->id,
                'title' => $area->name,
                'subtitle' => 'Area',
                'type' => 'area',
                'href' => route('areas.index', [], false) . '?' . http_build_query(['search' => $area->name]),
                'recent_at' => $area->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentSubAreas(?User $user, string $role): Collection
    {
        if (!$this->canSearchAreas($role)) {
            return collect();
        }

        $assignedAreaIds = $this->assignedAreaIds($user, $role);
        if (in_array($role, ['area-coordinator', 'program-coordinator'], true) && $assignedAreaIds->isEmpty()) {
            return collect();
        }

        return SubArea::query()
            ->with('area:id,name')
            ->select(['id', 'area_id', 'name', 'updated_at'])
            ->where('is_archived', false)
            ->when($assignedAreaIds->isNotEmpty(), fn($builder) => $builder->whereIn('area_id', $assignedAreaIds))
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(SubArea $subArea) => [
                'id' => 'recent-subarea-' . $subArea->id,
                'title' => $subArea->name,
                'subtitle' => $subArea->area?->name ?? 'Sub-area',
                'type' => 'area',
                'href' => route('areas.index', [], false) . '?' . http_build_query(['search' => $subArea->name]),
                'recent_at' => $subArea->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentStandards(string $role): Collection
    {
        if (!$this->canSearchStandards($role)) {
            return collect();
        }

        return Standard::query()
            ->select(['id', 'title', 'code', 'doc_type', 'updated_at'])
            ->where('is_active', true)
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(Standard $standard) => [
                'id' => 'recent-standard-' . $standard->id,
                'title' => $standard->title,
                'subtitle' => trim(($standard->code ?? 'Standard') . ' • ' . ucfirst($standard->doc_type ?? 'Reference')),
                'type' => 'standard',
                'href' => route('standards.index', [], false) . '?' . http_build_query(['search' => $standard->title]),
                'recent_at' => $standard->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentUsers(?User $viewer, string $role): Collection
    {
        if (!$this->canSearchUsers($role)) {
            return collect();
        }

        return User::query()
            ->select(['id', 'name', 'email', 'program_id', 'updated_at'])
            ->where('is_active', true)
            ->when($role === 'dean', function ($builder) use ($viewer) {
                $builder->where(function ($query) use ($viewer) {
                    if ($viewer?->program_id) {
                        $query->where('program_id', $viewer->program_id)
                            ->orWhere('id', $viewer->id);

                        return;
                    }

                    $query->where('id', $viewer?->id);
                });
            })
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(User $user) => [
                'id' => 'recent-user-' . $user->id,
                'title' => $user->name,
                'subtitle' => $user->email,
                'type' => 'user',
                'href' => route('users.index', [], false) . '?' . http_build_query(['search' => $user->email]),
                'recent_at' => $user->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function recentCycles(string $role): Collection
    {
        if (!$this->canSearchCycles($role)) {
            return collect();
        }

        return AccreditationCycle::query()
            ->select(['id', 'name', 'academic_year', 'is_active', 'updated_at'])
            ->latest('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn(AccreditationCycle $cycle) => [
                'id' => 'recent-cycle-' . $cycle->id,
                'title' => $cycle->name,
                'subtitle' => trim(($cycle->academic_year ?? 'Cycle') . ($cycle->is_active ? ' • Active' : '')),
                'type' => 'cycle',
                'href' => route('cycles.index', [], false) . '?' . http_build_query(['search' => $cycle->name]),
                'recent_at' => $cycle->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function documents(string $query, Collection $tokens, ?User $user, string $role): Collection
    {
        $documents = Document::query()
            ->with(['program:id,code,name', 'subArea:id,name,area_id', 'subArea.area:id,name'])
            ->select(['id', 'title', 'doc_type', 'status', 'program_id', 'sub_area_id', 'updated_at']);

        $this->scopeDocuments($documents, $user, $role);

        $documents->where(function ($builder) use ($tokens) {
            foreach ($tokens as $token) {
                $term = $this->likeTerm($token);
                $builder
                    ->orWhere('title', 'like', $term)
                    ->orWhere('doc_type', 'like', $term)
                    ->orWhere('status', 'like', $term)
                    ->orWhereHas('program', fn($program) => $program
                        ->where('name', 'like', $term)
                        ->orWhere('code', 'like', $term))
                    ->orWhereHas('subArea', fn($subArea) => $subArea
                        ->where('name', 'like', $term)
                        ->orWhereHas('area', fn($area) => $area->where('name', 'like', $term)));
            }
        });

        return $documents
            ->latest('updated_at')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn(Document $document) => [
                'id' => 'document-' . $document->id,
                'title' => $document->title,
                'subtitle' => trim(($document->program?->code ?? 'Document') . ' • ' . ($document->subArea?->name ?? ucfirst($document->doc_type ?? 'Evidence'))),
                'type' => 'document',
                'href' => route('documents.show', $document->id, false),
                'score' => $this->score($query, $tokens, [
                    $document->title,
                    $document->program?->code,
                    $document->program?->name,
                    $document->subArea?->name,
                    $document->subArea?->area?->name,
                    $document->doc_type,
                    $document->status,
                ], 8),
            ]);
    }

    private function programs(string $query, Collection $tokens, ?User $user, string $role): Collection
    {
        if (!$this->canSearchPrograms($role)) {
            return collect();
        }

        if (!$this->canViewAll($role) && !$user?->program_id) {
            return collect();
        }

        $programs = Program::query()
            ->select(['id', 'name', 'code', 'is_active'])
            ->where('is_active', true)
            ->when(
                !$this->canViewAll($role) && $user?->program_id,
                fn($builder) => $builder->where('id', $user->program_id)
            );

        $this->applyTokenSearch($programs, ['name', 'code'], $tokens);

        return $programs
            ->orderBy('code')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn(Program $program) => [
                'id' => 'program-' . $program->id,
                'title' => "{$program->code} • {$program->name}",
                'subtitle' => 'Program',
                'type' => 'program',
                'href' => route('programs.show', $program->id, false),
                'score' => $this->score($query, $tokens, [$program->code, $program->name], 7),
            ]);
    }

    private function areas(string $query, Collection $tokens, ?User $user, string $role): Collection
    {
        if (!$this->canSearchAreas($role)) {
            return collect();
        }

        $areas = Area::query()
            ->select(['id', 'name', 'order_number'])
            ->where('is_archived', false);

        $assignedAreaIds = $this->assignedAreaIds($user, $role);
        if (in_array($role, ['area-coordinator', 'program-coordinator'], true) && $assignedAreaIds->isEmpty()) {
            return collect();
        }

        if ($assignedAreaIds->isNotEmpty()) {
            $areas->whereIn('id', $assignedAreaIds);
        }

        $this->applyTokenSearch($areas, ['name'], $tokens);

        return $areas
            ->orderBy('order_number')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn(Area $area) => [
                'id' => 'area-' . $area->id,
                'title' => $area->name,
                'subtitle' => 'Area',
                'type' => 'area',
                'href' => route('areas.index', [], false) . '?' . http_build_query(['search' => $area->name]),
                'score' => $this->score($query, $tokens, [$area->name], 6),
            ]);
    }

    private function subAreas(string $query, Collection $tokens, ?User $user, string $role): Collection
    {
        if (!$this->canSearchAreas($role)) {
            return collect();
        }

        $subAreas = SubArea::query()
            ->with('area:id,name')
            ->select(['id', 'area_id', 'name', 'order_number'])
            ->where('is_archived', false);

        $assignedAreaIds = $this->assignedAreaIds($user, $role);
        if (in_array($role, ['area-coordinator', 'program-coordinator'], true) && $assignedAreaIds->isEmpty()) {
            return collect();
        }

        if ($assignedAreaIds->isNotEmpty()) {
            $subAreas->whereIn('area_id', $assignedAreaIds);
        }

        $subAreas->where(function ($builder) use ($tokens) {
            foreach ($tokens as $token) {
                $term = $this->likeTerm($token);
                $builder
                    ->orWhere('name', 'like', $term)
                    ->orWhereHas('area', fn($area) => $area->where('name', 'like', $term));
            }
        });

        return $subAreas
            ->orderBy('area_id')
            ->orderBy('order_number')
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn(SubArea $subArea) => [
                'id' => 'subarea-' . $subArea->id,
                'title' => $subArea->name,
                'subtitle' => $subArea->area?->name ?? 'Sub-area',
                'type' => 'area',
                'href' => route('areas.index', [], false) . '?' . http_build_query(['search' => $subArea->name]),
                'score' => $this->score($query, $tokens, [$subArea->name, $subArea->area?->name], 5),
            ]);
    }

    private function standards(string $query, Collection $tokens, string $role): Collection
    {
        if (!$this->canSearchStandards($role)) {
            return collect();
        }

        $standards = Standard::query()
            ->select(['id', 'title', 'code', 'doc_type'])
            ->where('is_active', true);

        $this->applyTokenSearch($standards, ['title', 'code', 'doc_type', 'original_filename'], $tokens);

        return $standards
            ->latest()
            ->limit(self::CANDIDATE_LIMIT)
            ->get()
            ->map(fn(Standard $standard) => [
                'id' => 'standard-' . $standard->id,
                'title' => $standard->title,
                'subtitle' => trim(($standard->code ?? 'Standard') . ' • ' . ucfirst($standard->doc_type ?? 'Reference')),
                'type' => 'standard',
                'href' => route('standards.index', [], false) . '?' . http_build_query(['search' => $standard->title]),
                'score' => $this->score($query, $tokens, [$standard->code, $standard->title, $standard->doc_type], 5),
            ]);
    }

    private function users(string $query, Collection $tokens, ?User $viewer, string $role): Collection
    {
        if (!$this->canSearchUsers($role)) {
            return collect();
        }

        $users = User::query()
            ->select(['id', 'name', 'email', 'program_id'])
            ->where('is_active', true)
            ->when($role === 'dean', function ($builder) use ($viewer) {
                $builder->where(function ($query) use ($viewer) {
                    if ($viewer?->program_id) {
                        $query->where('program_id', $viewer->program_id)
                            ->orWhere('id', $viewer->id);

                        return;
                    }

                    $query->where('id', $viewer?->id);
                });
            });

        $this->applyTokenSearch($users, ['name', 'email'], $tokens);

        return $users
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn(User $user) => [
                'id' => 'user-' . $user->id,
                'title' => $user->name,
                'subtitle' => $user->email,
                'type' => 'user',
                'href' => route('users.index', [], false) . '?' . http_build_query(['search' => $user->email]),
                'score' => $this->score($query, $tokens, [$user->name, $user->email], 4),
            ]);
    }

    private function cycles(string $query, Collection $tokens, string $role): Collection
    {
        if (!$this->canSearchCycles($role)) {
            return collect();
        }

        $cycles = AccreditationCycle::query()
            ->select(['id', 'name', 'academic_year', 'is_active']);

        $this->applyTokenSearch($cycles, ['name', 'academic_year', 'description'], $tokens);

        return $cycles
            ->orderByDesc('is_active')
            ->orderByDesc('start_date')
            ->limit(8)
            ->get()
            ->map(fn(AccreditationCycle $cycle) => [
                'id' => 'cycle-' . $cycle->id,
                'title' => $cycle->name,
                'subtitle' => trim(($cycle->academic_year ?? 'Cycle') . ($cycle->is_active ? ' • Active' : '')),
                'type' => 'cycle',
                'href' => route('cycles.index', [], false) . '?' . http_build_query(['search' => $cycle->name]),
                'score' => $this->score($query, $tokens, [$cycle->name, $cycle->academic_year], 4),
            ]);
    }
}
