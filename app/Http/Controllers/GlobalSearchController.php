<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Program;
use App\Models\Area;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('q');

        if (empty($query) || strlen($query) < 2) {
            return response()->json([
                'documents' => [],
                'programs' => [],
                'areas' => [],
            ]);
        }

        $documents = Document::where('title', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'title'])
            ->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'type' => 'document',
                'href' => route('documents.show', $d->id),
            ]);

        $programs = Program::where('name', 'like', "%{$query}%")
            ->orWhere('code', 'like', "%{$query}%")
            ->limit(3)
            ->get(['id', 'name', 'code'])
            ->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->name . " ({$p->code})",
                'type' => 'program',
                'href' => route('programs.show', $p->id),
            ]);

        $areas = Area::where('name', 'like', "%{$query}%")
            ->limit(3)
            ->get(['id', 'name'])
            ->map(fn($a) => [
                'id' => $a->id,
                'title' => $a->name,
                'type' => 'area',
                'href' => route('areas.index') . "?search=" . urlencode($a->name), // Simple link to areas page
            ]);

        return response()->json([
            'results' => $documents->concat($programs)->concat($areas),
        ]);
    }
}
