<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCycleRequest;
use App\Http\Requests\Admin\UpdateCycleRequest;
use App\Models\AccreditationCycle;
use App\Services\CycleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CycleController extends Controller
{
    public function __construct(
        protected CycleService $cycleService
    ) {}
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

    public function store(StoreCycleRequest $request)
    {
        $this->cycleService->createCycle($request->validated());

        return redirect()->back()->with('success', 'Accreditation cycle created.');
    }

    public function update(AccreditationCycle $cycle, UpdateCycleRequest $request)
    {
        $this->cycleService->updateCycle($cycle, $request->validated());

        return redirect()->back()->with('success', 'Cycle updated.');
    }

    public function activate(AccreditationCycle $cycle)
    {
        $this->cycleService->activateCycle($cycle);

        return redirect()->back()->with('success', "Cycle \"{$cycle->name}\" is now active.");
    }

    public function destroy(AccreditationCycle $cycle)
    {
        $deleted = $this->cycleService->deleteCycle($cycle);

        if (!$deleted) {
            return redirect()->back()->with('error', 'Cannot delete cycle with associated documents.');
        }

        return redirect()->back()->with('success', 'Cycle deleted.');
    }
}
