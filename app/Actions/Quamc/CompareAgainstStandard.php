<?php

namespace App\Actions\Quamc;

use App\Models\Evaluation;
use App\Rag\Quamc\EvaluationService;

class CompareAgainstStandard
{
    public function __construct(
        protected EvaluationService $evaluationService,
    ) {}

    public function __invoke(Evaluation $evaluation): array
    {
        return $this->evaluationService->compare($evaluation);
    }
}
