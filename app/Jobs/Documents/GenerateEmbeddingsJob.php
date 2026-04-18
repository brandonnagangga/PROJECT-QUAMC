<?php

namespace App\Jobs\Documents;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateEmbeddingsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourceType,
        public string $sourceId,
    ) {}

    public function handle(): void
    {
        // Embeddings are generated during vector-store indexing in this first pass.
    }
}
