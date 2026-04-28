<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccreditationCycle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CycleController extends Controller
{
    /** Resolve the slug of the requesting user's first role. */
    private function roleSlug(Request $request): string
    {
        return $request->user()->load('roles')->roles->first()?->slug ?? '';
    }

    public function index()
    {
        $cycles = AccreditationCycle::orderByDesc('start_date')->get();

        return Inertia::render('Cycles/Index', [
            'cycles' => $cycles->map(fn ($c) => [
                'id'              => $c->id,
                'name'            => $c->name,
                'academic_year'   => $c->academic_year,
                'start_date'      => $c->start_date->format('Y-m-d'),
                'end_date'        => $c->end_date->format('Y-m-d'),
                'is_active'       => $c->is_active,
                'description'     => $c->description,
                'document_count'  => $c->documents()->count(),
                'start_formatted' => $c->start_date->format('M j, Y'),
                'end_formatted'   => $c->end_date->format('M j, Y'),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        if (!in_array($this->roleSlug($request), ['director', 'admin'])) {
            abort(403, 'Only the QUAMC Director can create accreditation cycles.');
        }

        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after:start_date',
            'description'   => 'nullable|string|max:500',
            'is_active'     => 'boolean',
        ]);

        $cycle = AccreditationCycle::create($data);

        if ($request->boolean('is_active')) {
            $cycle->setAsActive();
        }

        return redirect()->back()->with('success', 'Accreditation cycle created.');
    }

    public function update(AccreditationCycle $cycle, Request $request)
    {
        if (!in_array($this->roleSlug($request), ['director', 'admin'])) {
            abort(403, 'Only the QUAMC Director can update accreditation cycles.');
        }

        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after:start_date',
            'description'   => 'nullable|string|max:500',
        ]);

        $cycle->update($data);

        return redirect()->back()->with('success', 'Cycle updated.');
    }

    public function activate(AccreditationCycle $cycle, Request $request)
    {
        if (!in_array($this->roleSlug($request), ['director', 'admin'])) {
            abort(403, 'Only the QUAMC Director can activate cycles.');
        }

        $cycle->setAsActive();

        return redirect()->back()->with('success', "Cycle \"{$cycle->name}\" is now active.");
    }

    /**
     * Director: manually deactivate (lock) a cycle without deleting it.
     */
    public function deactivate(AccreditationCycle $cycle, Request $request)
    {
        if (!in_array($this->roleSlug($request), ['director', 'admin'])) {
            abort(403, 'Only the QUAMC Director can lock cycles.');
        }

        $cycle->update(['is_active' => false]);

        return redirect()->back()->with('success', "Cycle \"{$cycle->name}\" has been locked. Uploads are now disabled.");
    }

    public function destroy(AccreditationCycle $cycle, Request $request)
    {
        if (!in_array($this->roleSlug($request), ['director', 'admin'])) {
            abort(403, 'Only the QUAMC Director can delete cycles.');
        }

        if ($cycle->documents()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete cycle with associated documents.');
        }

        $cycle->delete();

        return redirect()->back()->with('success', 'Cycle deleted.');
    }

    /**
     * Store the selected cycle in session so users can browse docs from any cycle.
     * Available to ALL authenticated users (read-only viewing switch).
     */
    public function switchViewing(AccreditationCycle $cycle, Request $request)
    {
        $request->session()->put('viewing_cycle_id', $cycle->id);

        return redirect()->back()->with('success', "Now viewing: {$cycle->name}");
    }
}
