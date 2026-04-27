<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Document;
use App\Models\Program;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user()->load('roles');
        $authRole = $authUser->roles->first()?->slug ?? '';
        $isDean   = $authRole === 'dean';

        $areas = Area::with('subAreas')->orderBy('order_number')->get();
        $totalAreas = $areas->count();

        $programQuery = Program::where('is_active', true);
        // Dean sees only their own program
        if ($isDean && $authUser->program_id) {
            $programQuery->where('id', $authUser->program_id);
        }

        $programs = $programQuery->get()
            ->map(function ($program) use ($areas, $totalAreas) {
                // Count slots across all sub-areas for this program
                $allSubAreaIds = $areas->flatMap(fn($a) => $a->subAreas->pluck('id'));
                $totalSlots    = $allSubAreaIds->count() * 3;

                $docs = Document::whereIn('sub_area_id', $allSubAreaIds)
                    ->where('program_id', $program->id)
                    ->get();

                $approved  = $docs->where('status', 'approved')->count();
                $pending   = $docs->where('status', 'pending_review')->count();
                $returned  = $docs->where('status', 'returned')->count();
                $pct       = $totalSlots > 0 ? round(($approved / $totalSlots) * 100) : 0;

                $areaBreakdown = $areas->map(function ($area) use ($program) {
                    $subAreaIds    = $area->subAreas->pluck('id');
                    $totalSlots    = $subAreaIds->count() * 3;
                    $approvedSlots = $totalSlots > 0
                        ? Document::whereIn('sub_area_id', $subAreaIds)
                            ->where('program_id', $program->id)
                            ->where('status', 'approved')
                            ->count()
                        : 0;
                    return [
                        'id'           => $area->id,
                        'name'         => $area->name,
                        'order_number' => $area->order_number,
                        'pct'          => $totalSlots > 0 ? round(($approvedSlots / $totalSlots) * 100) : 0,
                    ];
                });

                // Users assigned to this program
                $programUsers = User::with('roles')
                    ->where('program_id', $program->id)
                    ->get()
                    ->map(fn ($u) => [
                        'id'   => $u->id,
                        'name' => $u->name,
                        'email'=> $u->email,
                        'role' => $u->roles->first()?->name ?? '—',
                        'slug' => $u->roles->first()?->slug ?? '',
                    ]);

                return [
                    'id'            => $program->id,
                    'name'          => $program->name,
                    'code'          => $program->code,
                    'is_active'     => $program->is_active,
                    'logo_url'      => $program->logo_path
                                        ? route('programs.logo', $program->id)
                                        : null,
                    'totalAreas'    => $totalAreas,
                    'totalSlots'    => $totalSlots,
                    'approvedItems' => $approved,
                    'pendingItems'  => $pending,
                    'returnedItems' => $returned,
                    'pct'           => $pct,
                    'areas'         => $areaBreakdown->values()->toArray(),
                    'users'         => $programUsers->values()->toArray(),
                ];

            });

        // For admin: list of users not yet assigned to any program (for adding)
        $unassignedUsers = [];
        if ($authRole === 'admin') {
            $unassignedUsers = User::with('roles')
                ->whereNull('program_id')
                ->get()
                ->map(fn ($u) => [
                    'id'   => $u->id,
                    'name' => $u->name,
                    'email'=> $u->email,
                    'role' => $u->roles->first()?->name ?? '—',
                    'slug' => $u->roles->first()?->slug ?? '',
                ])
                ->values()
                ->toArray();
        }

        return Inertia::render('Programs/Index', [
            'programs'        => $programs,
            'authRole'        => $authRole,
            'unassignedUsers' => $unassignedUsers,
        ]);
    }

    /**
     * Admin: Create a new program (with optional logo).
     */
    public function store(Request $request)
    {
        $authRole = $request->user()->roles->first()?->slug ?? '';
        if ($authRole !== 'admin') abort(403);

        $data = $request->validate([
            'name'  => 'required|string|max:200',
            'code'  => 'required|string|max:20|unique:programs,code',
            'logo'  => 'nullable|image|max:2048', // 2 MB max
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('program-logos', 'local');
        }

        Program::create([
            'name'      => $data['name'],
            'code'      => $data['code'],
            'logo_path' => $logoPath,
            'is_active' => true,
        ]);

        return back()->with('success', "Program \"{$data['name']}\" created.");
    }

    /**
     * Admin: Upload / replace a program logo.
     */
    public function uploadLogo(Request $request, Program $program)
    {
        $authRole = $request->user()->roles->first()?->slug ?? '';
        if ($authRole !== 'admin') abort(403);

        $request->validate(['logo' => 'required|image|max:2048']);

        $logoPath = $request->file('logo')->store('program-logos', 'local');
        $program->update(['logo_path' => $logoPath]);

        return back()->with('success', 'Program logo updated.');
    }

    /**
     * Serve the program logo image.
     */
    public function serveLogo(Program $program)
    {
        if (!$program->logo_path) abort(404);

        $path = storage_path('app/private/' . $program->logo_path);
        if (!file_exists($path)) {
            $path = storage_path('app/' . $program->logo_path);
        }
        if (!file_exists($path)) abort(404);

        return response()->file($path, [
            'Content-Type'  => mime_content_type($path),
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Admin: Assign an existing user to this program.
     */
    public function addUser(Request $request, Program $program)
    {
        $authRole = $request->user()->roles->first()?->slug ?? '';
        if ($authRole !== 'admin') abort(403);

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        User::where('id', $data['user_id'])->update(['program_id' => $program->id]);

        return back()->with('success', 'User assigned to program.');
    }

    /**
     * Show a program as a file-manager style view.
     * Programs → Global Areas → Sub-Areas → 3 Slots (Input/Process/Outcome)
     */
    public function show(Program $program)
    {
        $areas = Area::with('subAreas')->orderBy('order_number')->get();

        $tree = $areas->map(function ($area) use ($program) {
            return [
                'id'           => $area->id,
                'name'         => $area->name,
                'order_number' => $area->order_number,
                'subAreas'     => $area->subAreas->sortBy('order_number')->map(function ($sa) use ($program) {
                    $docs = Document::with(['uploader', 'versions'])
                        ->where('sub_area_id', $sa->id)
                        ->where('program_id', $program->id)
                        ->get()
                        ->keyBy('doc_type');

                    $slots = [];
                    foreach (['input', 'process', 'outcome'] as $type) {
                        $doc = $docs->get($type);
                        $slots[$type] = $doc ? [
                            'id'              => $doc->id,
                            'title'           => $doc->title,
                            'status'          => $doc->status === 'pending_review' ? 'pending' : $doc->status,
                            'current_version' => $doc->current_version ?? 1,
                            'uploader'        => $doc->uploader?->name ?? '',
                            'updated_at'      => $doc->updated_at->format('M j, Y'),
                            'versions'        => $doc->versions->sortByDesc('version_number')->map(fn($v) => [
                                'id'                => $v->id,
                                'version_number'    => $v->version_number,
                                'original_filename' => $v->original_filename,
                                'file_size_bytes'   => $v->file_size_bytes,
                                'uploaded_at'       => $v->created_at->format('M j, Y H:i'),
                                'notes'             => $v->notes,
                            ])->values(),
                        ] : null;
                    }

                    return [
                        'id'               => $sa->id,
                        'name'             => $sa->name,
                        'order_number'     => $sa->order_number,
                        'submission_status'=> $sa->submission_status,
                        'slots'            => $slots,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Programs/Show', [
            'program' => [
                'id'   => $program->id,
                'name' => $program->name,
                'code' => $program->code,
            ],
            'tree' => $tree,
        ]);
    }
}
