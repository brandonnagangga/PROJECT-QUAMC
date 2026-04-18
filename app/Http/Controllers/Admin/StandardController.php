<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStandardRequest;
use App\Jobs\Documents\IngestDocumentPipelineJob;
use App\Models\Area;
use App\Models\Standard;
use App\Models\SubArea;
use Inertia\Inertia;

class StandardController extends Controller
{
    public function index()
    {
        abort_unless(request()->user()?->hasAnyRole(['admin', 'director']), 403);

        return Inertia::render('Standards/Index', [
            'standards' => Standard::with(['area', 'subArea', 'rubric'])
                ->latest()
                ->get()
                ->map(fn (Standard $standard) => [
                    'id' => $standard->id,
                    'title' => $standard->title,
                    'code' => $standard->code,
                    'doc_type' => $standard->doc_type,
                    'area' => $standard->area?->name,
                    'sub_area' => $standard->subArea?->name,
                    'index_status' => $standard->index_status,
                    'rubric' => $standard->rubric?->title,
                    'uploaded_at' => optional($standard->created_at)->format('M j, Y'),
                ]),
            'areas' => Area::where('is_archived', false)
                ->with(['subAreas' => fn ($query) => $query->where('is_archived', false)->orderBy('order_number')])
                ->orderBy('order_number')
                ->get()
                ->map(fn (Area $area) => [
                    'id' => $area->id,
                    'name' => $area->name,
                    'sub_areas' => $area->subAreas->map(fn (SubArea $subArea) => [
                        'id' => $subArea->id,
                        'name' => $subArea->name,
                    ])->values(),
                ]),
        ]);
    }

    public function store(StoreStandardRequest $request)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'director']), 403);

        $file = $request->file('file');
        $secureFilename = hash('sha256', uniqid('', true) . time()) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('standards', $secureFilename, 'local');

        $standard = Standard::create([
            'title' => $request->validated('title'),
            'code' => $request->validated('code'),
            'description' => $request->validated('description'),
            'area_id' => $request->validated('area_id'),
            'sub_area_id' => $request->validated('sub_area_id'),
            'doc_type' => $request->validated('doc_type'),
            'uploaded_by' => $request->user()->id,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'index_status' => 'pending',
        ]);

        IngestDocumentPipelineJob::dispatch($standard::class, $standard->id);

        return back()->with('success', 'Reference standard uploaded. Retrieval indexing has started.');
    }
}
