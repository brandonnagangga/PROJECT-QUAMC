<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignAreaRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Models\Role;
use App\Models\Program;
use App\Models\AreaAssignment;
use App\Services\UserService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}
    public function index(Request $request)
    {
        $authUser = $request->user();
        $authRole = $authUser->roles->first()?->slug ?? '';
        $isDean   = $authRole === 'dean';

        // Programs: Dean sees only their assigned program, others see all
        $programQuery = Program::where('is_active', true);
        if ($isDean && $authUser->program_id) {
            $programQuery->where('id', $authUser->program_id);
        }
        $programs = $programQuery->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code]);

        // Users: Dean sees only users in their program; Admin/Director see all
        $userQuery = User::with(['roles']);
        if ($isDean && $authUser->program_id) {
            $userQuery->where(function ($q) use ($authUser) {
                $q->where('program_id', $authUser->program_id)
                  ->orWhere('id', $authUser->id); // always include self
            });
        }
        $users = $userQuery->get()->map(function ($u) {
            return [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'is_active'  => $u->is_active,
                'program_id' => $u->program_id,
                'roles'      => $u->roles->map(fn ($r) => [
                    'id'   => $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                ]),
                'created_at' => $u->created_at->format('M j, Y'),
            ];
        });

        // Area assignments — scoped to same program users when Dean
        $assignmentQuery = AreaAssignment::with(['user', 'area']);
        if ($isDean && $authUser->program_id) {
            $programUserIds = User::where('program_id', $authUser->program_id)->pluck('id');
            $assignmentQuery->whereIn('user_id', $programUserIds);
        }
        $assignments = $assignmentQuery->get()->map(fn ($a) => [
            'id'           => $a->id,
            'user_id'      => $a->user_id,
            'user_name'    => $a->user?->name,
            'area_id'      => $a->area_id,
            'area_name'    => $a->area?->name,
            'role_type'    => $a->role_type,
            'academic_year'=> $a->academic_year,
        ]);

        $roles = Role::all()->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'slug' => $r->slug]);

        return Inertia::render('Users/Index', [
            'users'          => $users,
            'roles'          => $roles,
            'programs'       => $programs,
            'assignments'    => $assignments,
            'authRole'       => $authRole,
            'deanProgramId'  => $isDean ? $authUser->program_id : null,
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        Gate::authorize('create', User::class);

        $this->userService->createUser($request->validated());

        return redirect()->back()->with('success', 'User created.');
    }

    public function export(Request $request)
    {
        Gate::authorize('viewAny', User::class);

        $authUser = $request->user();
        $authRole = $authUser->roles->first()?->slug ?? '';
        $format = $request->string('format')->lower()->value() ?: 'csv';

        $userQuery = User::with(['roles', 'program']);
        if ($authRole === 'dean' && $authUser->program_id) {
            $userQuery->where(function ($query) use ($authUser) {
                $query->where('program_id', $authUser->program_id)
                    ->orWhere('id', $authUser->id);
            });
        }

        $users = $userQuery->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.users-directory', [
                'users' => $users,
                'generatedAt' => now(),
            ])->setPaper('a4', 'portrait');

            return $pdf->download('users-directory.pdf');
        }

        return response()->streamDownload(function () use ($users) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['name', 'email', 'role', 'department', 'status', 'joined_at']);

            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->name,
                    $user->email,
                    $user->roles->first()?->name ?? '',
                    $user->program?->name ?? '',
                    $user->is_active ? 'Active' : 'Inactive',
                    $user->created_at?->format('Y-m-d') ?? '',
                ]);
            }

            fclose($handle);
        }, 'users-directory.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function assignArea(AssignAreaRequest $request)
    {
        Gate::authorize('assignArea', User::class);

        $validated = $request->validated();
        $user = User::findOrFail($validated['user_id']);

        $created = $this->userService->assignAreas(
            $user,
            $validated['area_ids'],
            $validated['role_type'],
            $validated['academic_year'],
            $request->user()
        );

        $msg = $created > 0
            ? "{$created} area(s) assigned successfully."
            : 'All selected areas were already assigned.';

        return redirect()->back()->with('success', $msg);
    }

    public function toggleActive(Request $request, User $user)
    {
        Gate::authorize('update', $user);

        $this->userService->toggleUserStatus($user);

        return redirect()->back()->with('success', 'User status updated.');
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        Gate::authorize('update', $user);

        $this->userService->updateUser($user, $request->validated());

        return redirect()->back()->with('success', 'User updated.');
    }

    public function assignRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->roles()->sync([$validated['role_id']]);
        return redirect()->back()->with('success', 'Role assigned.');
    }

    public function removeAssignment(Request $request, $areaId, $userId)
    {
        Gate::authorize('assignArea', User::class);
        
        AreaAssignment::where('area_id', $areaId)
            ->where('user_id', $userId)
            ->delete();
            
        return redirect()->back()->with('success', 'Assignment removed.');
    }

}
