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
            'hidden_widgets' => ['nullable', 'array'],
            'hidden_widgets.*' => ['string', 'max:120'],
            'is_edit_mode' => ['required', 'boolean'],
        ]);

        $hiddenWidgets = collect($validated['hidden_widgets'] ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->map(fn ($id) => trim($id))
            ->unique()
            ->values()
            ->all();

        $request->user()->update([
            'dashboard_preferences' => [
                'hidden_widgets' => $hiddenWidgets,
                'is_edit_mode' => (bool) $validated['is_edit_mode'],
            ],
        ]);

        return back(303);
    }
}

