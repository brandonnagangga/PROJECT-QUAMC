<?php

namespace App\Rag\Quamc;

use App\Models\Evaluation;

class NeutralSummaryService
{
    public function build(Evaluation $evaluation): string
    {
        $summary = (string) data_get($evaluation->ai_response, 'neutral_summary', '');

        if ($summary !== '') {
            return $summary;
        }

        return sprintf(
            'Evaluation completed with %d matched requirements, %d missing requirements, and %d unclear items.',
            $evaluation->matched_requirements_count,
            $evaluation->missing_requirements_count,
            $evaluation->unclear_items_count,
        );
    }
}
