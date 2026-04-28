<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardPreferencesController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'hidden_widgets' => ['sometimes', 'array'],
            'hidden_widgets.*' => ['string', 'max:120'],
            'is_edit_mode' => ['sometimes', 'boolean'],
            'readiness_chart_types' => ['sometimes', 'array'],
            'readiness_chart_types.*' => ['string', 'in:area,pie,bar,line'],
        ]);

        $existing = $request->user()->dashboard_preferences ?? [
            'hidden_widgets' => [],
            'is_edit_mode' => false,
            'readiness_chart_types' => ['area'],
        ];

        $preferences = [
            'hidden_widgets' => is_array($existing['hidden_widgets'] ?? null) ? $existing['hidden_widgets'] : [],
            'is_edit_mode' => (bool) ($existing['is_edit_mode'] ?? false),
            'readiness_chart_types' => is_array($existing['readiness_chart_types'] ?? null)
                ? $existing['readiness_chart_types']
                : ['area'],
        ];

        if (array_key_exists('hidden_widgets', $validated)) {
            $preferences['hidden_widgets'] = collect($validated['hidden_widgets'] ?? [])
                ->filter(fn ($id) => is_string($id) && trim($id) !== '')
                ->map(fn ($id) => trim($id))
                ->unique()
                ->values()
                ->all();
        }

        if (array_key_exists('is_edit_mode', $validated)) {
            $preferences['is_edit_mode'] = (bool) $validated['is_edit_mode'];
        }

        if (array_key_exists('readiness_chart_types', $validated)) {
            $chartTypes = collect($validated['readiness_chart_types'] ?? [])
                ->filter(fn ($type) => is_string($type) && in_array($type, ['area', 'pie', 'bar', 'line'], true))
                ->map(fn ($type) => $type === 'line' ? 'pie' : $type)
                ->unique()
                ->values()
                ->all();

            $preferences['readiness_chart_types'] = count($chartTypes) > 0 ? $chartTypes : ['area'];
        }

        $request->user()->update([
            'dashboard_preferences' => $preferences,
        ]);

        return back(303);
    }
}
