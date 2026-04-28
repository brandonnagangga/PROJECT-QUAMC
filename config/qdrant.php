<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Qdrant Vector Store
    |--------------------------------------------------------------------------
    |
    | MySQL remains the system of record for QUAMC business data.
    | Qdrant is used only for vector search over chunk embeddings.
    |
    */
    'enabled' => filter_var(env('QDRANT_ENABLED', false), FILTER_VALIDATE_BOOL),

    'url' => env('QDRANT_URL', 'http://127.0.0.1:6333'),

    'api_key' => env('QDRANT_API_KEY'),

    'collection' => env('QDRANT_COLLECTION', 'quamc_standards'),

    'timeout' => (int) env('QDRANT_TIMEOUT', 10),
];
