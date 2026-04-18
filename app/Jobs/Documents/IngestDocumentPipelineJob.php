<?php

namespace App\Jobs\Documents;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;

class IngestDocumentPipelineJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourceType,
        public string $sourceId,
    ) {}

    public function handle(): void
    {
        Bus::chain([
            new ExtractPdfTextJob($this->sourceType, $this->sourceId),
            new ChunkDocumentJob($this->sourceType, $this->sourceId),
            new GenerateEmbeddingsJob($this->sourceType, $this->sourceId),
            new IndexChunksJob($this->sourceType, $this->sourceId),
        ])->dispatch();
    }
}
