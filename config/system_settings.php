<?php

return [
    'defaults' => [
        'appName' => env('VITE_APP_NAME', config('app.name', 'QUAMC')),
        'appDetails' => 'Quality Assurance Center',
        'appLogoPath' => '',
        'socialWebsite' => '',
        'socialFacebook' => '',
        'socialLinkedIn' => '',
        'socialX' => '',

        // Legacy settings still used by exports and existing screens.
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
    ],

    'schema' => [
        [
            'key' => 'general',
            'title' => 'General',
            'icon' => 'settings',
            'fields' => [
                ['key' => 'appName', 'label' => 'App Name', 'type' => 'text'],
                [
                    'key' => 'appLogo',
                    'label' => 'App Logo',
                    'type' => 'file',
                    'accept' => 'image/png,image/jpeg,image/webp,image/svg+xml',
                    'previewKey' => 'appLogoUrl',
                    'description' => 'Upload the logo shown across the application.',
                ],
                [
                    'key' => 'appDetails',
                    'label' => 'App Details',
                    'type' => 'textarea',
                    'description' => 'Short description used for app identity and public-facing context.',
                ],
                ['key' => 'socialWebsite', 'label' => 'Website', 'type' => 'url'],
                ['key' => 'socialFacebook', 'label' => 'Facebook', 'type' => 'url'],
                ['key' => 'socialLinkedIn', 'label' => 'LinkedIn', 'type' => 'url'],
                ['key' => 'socialX', 'label' => 'X / Twitter', 'type' => 'url'],
            ],
        ],
        [
            'key' => 'notifications',
            'title' => 'Notifications',
            'icon' => 'bell',
            'fields' => [
                [
                    'key' => 'emailNotifications',
                    'label' => 'Enable Email Notifications',
                    'type' => 'toggle',
                    'description' => 'Send system notifications through email.',
                ],
                ['key' => 'documentSubmitted', 'label' => 'Document Submitted', 'type' => 'toggle'],
                ['key' => 'documentApproved', 'label' => 'Document Approved', 'type' => 'toggle'],
                ['key' => 'documentReturned', 'label' => 'Document Returned', 'type' => 'toggle'],
                ['key' => 'deadlineReminder', 'label' => 'Deadline Reminders', 'type' => 'toggle'],
            ],
        ],
        [
            'key' => 'data-controls',
            'title' => 'Data Controls',
            'icon' => 'database',
            'fields' => [
                ['key' => 'maxFileSize', 'label' => 'Max File Size (MB)', 'type' => 'number'],
                [
                    'key' => 'allowedExtensions',
                    'label' => 'Allowed Extensions',
                    'type' => 'text',
                    'description' => 'Comma-separated file extensions accepted during upload.',
                ],
                ['key' => 'storageLimit', 'label' => 'Storage Limit (GB)', 'type' => 'number'],
            ],
        ],
        [
            'key' => 'security',
            'title' => 'Security',
            'icon' => 'shield',
            'fields' => [
                [
                    'key' => 'sessionTimeout',
                    'label' => 'Session Timeout (minutes)',
                    'type' => 'number',
                    'description' => 'Automatically sign out inactive users after this duration.',
                ],
            ],
        ],
    ],
];
