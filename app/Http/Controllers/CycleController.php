<?php

namespace App\Http\Controllers;

use App\Models\AccreditationCycle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CycleController extends Controller
{
    public function index()
    {
        $cycles = AccreditationCycle::orderByDesc('start_date')->get();

        return Inertia::render('Cycles/Index', [
            'cycles' => $cycles->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'academic_year' => $c->academic_year,
                'start_date' => $c->start_date->format('Y-m-d'),
                'end_date' => $c->end_date->format('Y-m-d'),
                'is_active' => $c->is_active,
                'description' => $c->description,
                'document_count' => $c->documents()->count(),
                'start_formatted' => $c->start_date->format('M j, Y'),
                'end_formatted' => $c->end_date->format('M j, Y'),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        $cycle = AccreditationCycle::create($data);

        if ($request->boolean('is_active')) {
            $cycle->setAsActive();
        }

        return redirect()->back()->with('success', 'Accreditation cycle created.');
    }

    public function update(AccreditationCycle $cycle, Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'academic_year' => 'required|string|max:20',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'description' => 'nullable|string|max:500',
        ]);

        $cycle->update($data);

        return redirect()->back()->with('success', 'Cycle updated.');
    }

    public function activate(AccreditationCycle $cycle)
    {
        $cycle->setAsActive();

        return redirect()->back()->with('success', "Cycle \"{$cycle->name}\" is now active.");
    }

    public function destroy(AccreditationCycle $cycle)
    {
        if ($cycle->documents()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete cycle with associated documents.');
        }

        $cycle->delete();

        return redirect()->back()->with('success', 'Cycle deleted.');
    }
}
