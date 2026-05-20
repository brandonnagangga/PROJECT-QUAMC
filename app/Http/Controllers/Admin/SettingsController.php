<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Storage;
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
            'settingsSchema' => $this->settingsService->getSettingsSchema(),
        ]);
    }

    public function update(UpdateSettingsRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('appLogo')) {
            $oldLogoPath = (string) $this->settingsService->getSetting('appLogoPath', '');
            if ($oldLogoPath !== '' && Storage::disk('local')->exists($oldLogoPath)) {
                Storage::disk('local')->delete($oldLogoPath);
            }

            $data['appLogoPath'] = $request->file('appLogo')->store('settings', 'local');
            unset($data['appLogo']);
        }

        $this->settingsService->updateSettings($data);

        return redirect()->back()->with('success', 'Settings saved successfully.');
    }

    public function logo()
    {
        $path = (string) $this->settingsService->getSetting('appLogoPath', '');
        abort_unless($path !== '' && Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path));
    }
}
