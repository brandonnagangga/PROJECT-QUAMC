<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\SettingsService;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {}

    public function index()
    {
        $settings = $this->settingsService->getAllSettings();

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(UpdateSettingsRequest $request)
    {
        $this->settingsService->updateSettings($request->validated());

        return redirect()->back()->with('success', 'Settings saved successfully.');
    }
}
