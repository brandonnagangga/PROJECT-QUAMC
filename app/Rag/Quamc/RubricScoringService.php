<?php

namespace App\Rag\Quamc;

use App\Models\Evaluation;

class RubricScoringService
{
    /**
     * QUAMC business logic owns the scoring outcome.
     * The AI output is only one structured input into this calculation.
     */
    public function score(Evaluation $evaluation): array
    {
        $requirements = collect($evaluation->standard?->rubric?->criteria ?? []);
        $matched = collect($evaluation->ai_response['matched_requirements'] ?? []);
        $missing = collect($evaluation->ai_response['missing_requirements'] ?? []);

        if ($requirements->isEmpty()) {
            $maxScore = (float) config('quamc.evaluation.default_max_score', 100);
            $total = $matched->count() + $missing->count();
            $score = $total > 0 ? round(($matched->count() / $total) * $maxScore, 2) : 0.0;

            return [
                'total_score' => $score,
                'max_score' => $maxScore,
                'criteria' => [],
                'status_label' => $this->statusForScore($score, $maxScore),
            ];
        }

        $matchedKeys = $matched->pluck('requirement_key')->filter()->all();
        $criteria = [];
        $score = 0.0;

        foreach ($requirements as $criterion) {
            $criterionScore = in_array($criterion->code ?: $criterion->id, $matchedKeys, true)
                ? (float) $criterion->weight
                : 0.0;

            $score += $criterionScore;
            $criteria[] = [
                'criterion_id' => $criterion->id,
                'title' => $criterion->title,
                'weight' => (float) $criterion->weight,
                'score' => $criterionScore,
            ];
        }

        $maxScore = round((float) $requirements->sum('weight'), 2);

        return [
            'total_score' => round($score, 2),
            'max_score' => $maxScore,
            'criteria' => $criteria,
            'status_label' => $this->statusForScore($score, $maxScore),
        ];
    }

    protected function statusForScore(float $score, float $maxScore): string
    {
        $percent = $maxScore > 0 ? ($score / $maxScore) * 100 : 0;

        foreach (config('quamc.evaluation.statuses', []) as $label => $threshold) {
            if ($percent >= $threshold) {
                return $label;
            }
        }

        return 'incomplete';
    }
}
