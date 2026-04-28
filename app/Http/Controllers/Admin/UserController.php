<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Program;
use App\Models\AreaAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UserController extends Controller
{
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6',
            'role_id'    => 'required|exists:roles,id',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        $user = User::create([
            'id'         => (string) Str::uuid(),
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'program_id' => $validated['program_id'] ?? null,
            'is_active'  => true,
        ]);

        $user->roles()->attach($validated['role_id']);

        return redirect()->back()->with('success', 'User created.');
    }

    public function assignArea(Request $request, User $user)
    {
        $authUser = $request->user();
        $authRole = $authUser->roles->first()?->slug ?? '';

        // Allow admin or dean (dean scoped to their program)
        if (!in_array($authRole, ['admin', 'dean'])) {
            abort(403, 'Only admins or Deans may assign areas.');
        }

        $validated = $request->validate([
            'area_ids'      => 'required|array|min:1',
            'area_ids.*'    => 'required|exists:areas,id',
            'role_type'     => 'required|string',
            'academic_year' => 'required|string',
        ]);

        $created = 0;
        foreach ($validated['area_ids'] as $areaId) {
            $exists = AreaAssignment::where('user_id', $user->id)
                ->where('area_id', $areaId)
                ->where('academic_year', $validated['academic_year'])
                ->exists();

            if (!$exists) {
                AreaAssignment::create([
                    'user_id'       => $user->id,
                    'area_id'       => $areaId,
                    'assigned_by'   => $authUser->id,
                    'role_type'     => $validated['role_type'],
                    'academic_year' => $validated['academic_year'],
                ]);
                $created++;
            }
        }

        $msg = $created > 0
            ? "{$created} area(s) assigned successfully."
            : 'All selected areas were already assigned.';

        return redirect()->back()->with('success', $msg);
    }

    public function toggleActive(Request $request, User $user)
    {
        $user->update(['is_active' => !$user->is_active]);
        return redirect()->back()->with('success', 'User status updated.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:6',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
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
        AreaAssignment::where('area_id', $areaId)
            ->where('user_id', $userId)
            ->delete();
        return redirect()->back()->with('success', 'Assignment removed.');
    }

    /**
     * Admin-only: assign (or clear) a user's program_id.
     */
    public function assignProgram(Request $request, User $user)
    {
        $authUser = $request->user();
        $authRole = $authUser->roles->first()?->slug ?? '';

        // Only System Admin can assign programs
        if ($authRole !== 'admin') {
            abort(403, 'Only the System Administrator may assign programs to users.');
        }

        $validated = $request->validate([
            'program_id' => 'nullable|exists:programs,id',
        ]);

        $user->update(['program_id' => $validated['program_id']]);

        $programName = $validated['program_id']
            ? Program::find($validated['program_id'])?->name
            : 'None';

        return redirect()->back()->with('success', "Program for {$user->name} set to: {$programName}.");
    }
}

