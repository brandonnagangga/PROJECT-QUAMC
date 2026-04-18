<?php

namespace App\Jobs\Documents;

use App\Models\DocumentVersion;
use App\Models\Standard;
use App\Rag\Retrieval\DocumentChunker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ChunkDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourceType,
        public string $sourceId,
    ) {}

    public function handle(DocumentChunker $chunker): void
    {
        $model = $this->resolveModel();
        $chunks = $chunker->chunk((string) $model->extracted_text, [
            'title' => $model->title ?? $model->document?->title,
            'doc_type' => $model->doc_type ?? $model->document?->doc_type,
        ]);

        cache()->put($this->cacheKey(), $chunks, now()->addMinutes(10));

        $model->update([
            'index_status' => empty($chunks) ? 'failed' : 'chunked',
            'index_error' => empty($chunks) ? 'No chunks were generated from extracted text.' : null,
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
