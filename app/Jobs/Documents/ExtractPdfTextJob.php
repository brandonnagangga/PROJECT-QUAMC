<?php

namespace App\Jobs\Documents;

use App\Models\DocumentVersion;
use App\Models\Standard;
use App\Rag\Retrieval\PdfTextExtractor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ExtractPdfTextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $sourceType,
        public string $sourceId,
    ) {}

    public function handle(PdfTextExtractor $extractor): void
    {
        $model = $this->resolveModel();
        $path = storage_path('app/' . $model->file_path);
        $text = $extractor->extractFromPath($path, $model->mime_type);

        $model->update([
            'extracted_text' => $text,
            'extracted_at' => now(),
            'index_status' => $text === '' ? 'failed' : 'extracted',
            'index_error' => $text === '' ? 'No extractable text was found.' : null,
        ]);
    }

    protected function resolveModel(): DocumentVersion|Standard
    {
        return $this->sourceType === Standard::class
            ? Standard::findOrFail($this->sourceId)
            : DocumentVersion::findOrFail($this->sourceId);
    }
}
