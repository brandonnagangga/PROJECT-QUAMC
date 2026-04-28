<?php

return [
    'driver' => env('AI_DRIVER', 'heuristic'),

    'comparison_model' => env('AI_COMPARISON_MODEL', 'gpt-4.1-mini'),

    'timeout' => (int) env('AI_TIMEOUT', 60),

    'openai_compatible' => [
        'base_url' => env('AI_BASE_URL'),
        'api_key' => env('AI_API_KEY'),
        'chat_endpoint' => env('AI_CHAT_ENDPOINT', '/chat/completions'),
    ],
];
