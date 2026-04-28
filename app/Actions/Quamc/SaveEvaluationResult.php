<?php

namespace App\Actions\Quamc;

use App\Models\Evaluation;
use App\Rag\Quamc\EvaluationService;

class SaveEvaluationResult
{
    public function __construct(
        protected EvaluationService $evaluationService,
    ) {}

    public function __invoke(Evaluation $evaluation): Evaluation
    {
        return $this->evaluationService->finalize($evaluation);
    }
}
