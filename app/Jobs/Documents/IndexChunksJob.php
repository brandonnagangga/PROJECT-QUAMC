<?php

namespace App\Jobs\Documents;

use App\Models\DocumentVersion;
use App\Models\Standard;
use App\Rag\Retrieval\VectorStoreService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class IndexChunksJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourceType,
        public string $sourceId,
    ) {}

    public function handle(VectorStoreService $vectorStore): void
    {
        $model = $this->resolveModel();
        $chunks = cache()->pull($this->cacheKey(), []);
        $vectorStore->reindex($model, $chunks);

        $model->update([
            'index_status' => empty($chunks) ? 'failed' : 'indexed',
            'index_error' => empty($chunks) ? 'No chunks were available for indexing.' : null,
        ]);
    }

    protected function cacheKey(): string
    {
        return 'rag:chunks:' . md5($this->sourceType . ':' . $this->sourceId);
    }

    protected function resolveModel(): DocumentVersion|Standard
    {
        return $this->sourceType === Standard::class
            ? Standard::findOrFail($this->sourceId)
            : DocumentVersion::findOrFail($this->sourceId);
    }
}
