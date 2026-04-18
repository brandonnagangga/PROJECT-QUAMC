<?php

return [
    'chunk_size' => (int) env('RETRIEVAL_CHUNK_SIZE', 1200),
    'chunk_overlap' => (int) env('RETRIEVAL_CHUNK_OVERLAP', 200),
    'top_k' => (int) env('RETRIEVAL_TOP_K', 6),
    'embedding_driver' => env('EMBEDDING_DRIVER', 'local'),
    'embedding_dimensions' => (int) env('EMBEDDING_DIMENSIONS', 64),
];
