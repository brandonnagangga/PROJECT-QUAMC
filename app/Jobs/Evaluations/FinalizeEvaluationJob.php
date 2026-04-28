<?php

namespace App\Jobs\Evaluations;

use App\Models\Evaluation;
use App\Rag\Quamc\EvaluationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FinalizeEvaluationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $evaluationId,
    ) {}

    public function handle(EvaluationService $evaluationService): void
    {
        $evaluationService->finalize(Evaluation::findOrFail($this->evaluationId));
    }
}
