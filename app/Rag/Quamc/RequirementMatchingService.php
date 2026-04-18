<?php

namespace App\Rag\Quamc;

use App\Models\Evaluation;

class RequirementMatchingService
{
    public function summarize(Evaluation $evaluation): array
    {
        $response = $evaluation->ai_response ?? [];

        return [
            'matched' => count($response['matched_requirements'] ?? []),
            'missing' => count($response['missing_requirements'] ?? []),
            'unclear' => count($response['unclear_items'] ?? []),
        ];
    }
}
