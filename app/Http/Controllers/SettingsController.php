<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $defaults = [
            'institution' => 'State University',
            'academicYear' => '2024-2025',
            'accreditationBody' => 'AACCUP',
            'systemName' => 'QUAMC',
            'sessionTimeout' => '60',
            'maxFileSize' => '50',
            'allowedExtensions' => 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,png',
            'storageLimit' => '10',
            'emailNotifications' => '1',
            'documentSubmitted' => '1',
            'documentApproved' => '1',
            'documentReturned' => '1',
            'deadlineReminder' => '1',
        ];

        $saved = Setting::allAsArray();
        $settings = array_merge($defaults, $saved);

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'institution' => 'nullable|string|max:255',
            'academicYear' => 'nullable|string|max:20',
            'accreditationBody' => 'nullable|string|max:120',
            'systemName' => 'nullable|string|max:60',
            'sessionTimeout' => 'nullable|string|max:10',
            'maxFileSize' => 'nullable|string|max:10',
            'allowedExtensions' => 'nullable|string|max:500',
            'storageLimit' => 'nullable|string|max:10',
            'emailNotifications' => 'nullable|string',
            'documentSubmitted' => 'nullable|string',
            'documentApproved' => 'nullable|string',
            'documentReturned' => 'nullable|string',
            'deadlineReminder' => 'nullable|string',
        ]);

        foreach ($data as $key => $value) {
            Setting::setValue($key, $value);
        }

        return redirect()->back()->with('success', 'Settings saved successfully.');
    }
}
