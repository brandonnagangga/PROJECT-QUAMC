<?php

namespace App\Actions\Quamc;

use App\Jobs\Evaluations\ComputeScoreJob;
use App\Jobs\Evaluations\FinalizeEvaluationJob;
use App\Jobs\Evaluations\RetrieveRelevantChunksJob;
use App\Jobs\Evaluations\RunAiComparisonJob;
use App\Models\Document;
use App\Models\Evaluation;
use App\Models\Standard;
use App\Models\User;
use App\Rag\Quamc\EvaluationService;
use Illuminate\Support\Facades\Bus;

class AnalyzeSubmittedDocument
{
    public function __construct(
        protected EvaluationService $evaluationService,
    ) {}

    public function __invoke(Document $document, Standard $standard, ?User $requestedBy = null): Evaluation
    {
        $evaluation = $this->evaluationService->create($document, $standard, $requestedBy);

        Bus::chain([
            new RetrieveRelevantChunksJob($evaluation->id),
            new RunAiComparisonJob($evaluation->id),
            new ComputeScoreJob($evaluation->id),
            new FinalizeEvaluationJob($evaluation->id),
        ])->dispatch();

        return $evaluation;
    }
}
