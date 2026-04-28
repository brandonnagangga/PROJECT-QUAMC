<?php

namespace App\Rag\AI;

use App\Prompts\Quamc\DocumentComparisonPrompt;

class PromptBuilder
{
    public function __construct(
        protected DocumentComparisonPrompt $comparisonPrompt,
    ) {}

    public function comparison(array $payload): array
    {
        return [
            ['role' => 'system', 'content' => $this->comparisonPrompt->system()],
            ['role' => 'user', 'content' => $this->comparisonPrompt->user($payload)],
        ];
    }
}
