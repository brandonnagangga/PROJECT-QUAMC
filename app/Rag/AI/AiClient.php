<?php

namespace App\Rag\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiClient
{
    public function __construct(
        protected PromptBuilder $promptBuilder,
        protected ResponseParser $responseParser,
        protected StructuredOutputValidator $validator,
    ) {}

    public function compare(array $payload): array
    {
        $driver = config('ai.driver', 'heuristic');

        $result = $driver === 'openai_compatible'
            ? $this->compareWithRemoteModel($payload)
            : $this->compareHeuristically($payload);

        return $this->validator->validateComparisonResult($result);
    }

    protected function compareWithRemoteModel(array $payload): array
    {
        $baseUrl = rtrim((string) config('ai.openai_compatible.base_url'), '/');
        $apiKey = (string) config('ai.openai_compatible.api_key');

        if ($baseUrl === '' || $apiKey === '') {
            return $this->compareHeuristically($payload);
        }

        $response = Http::baseUrl($baseUrl)
            ->timeout((int) config('ai.timeout', 60))
            ->withToken($apiKey)
            ->post((string) config('ai.openai_compatible.chat_endpoint'), [
                'model' => config('ai.comparison_model'),
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object'],
                'messages' => $this->promptBuilder->comparison($payload),
            ]);

        if (!$response->successful()) {
            return $this->compareHeuristically($payload);
        }

        $content = data_get($response->json(), 'choices.0.message.content', '');

        return $this->responseParser->parseJson((string) $content);
    }

    protected function compareHeuristically(array $payload): array
    {
        $documentExcerpt = Str::lower((string) data_get($payload, 'submitted_document.excerpt', ''));
        $matched = [];
        $missing = [];

        foreach ($payload['requirements'] ?? [] as $requirement) {
            $title = Str::lower(($requirement['title'] ?? '') . ' ' . ($requirement['description'] ?? ''));
            $keywords = collect(preg_split('/[^a-z0-9]+/i', $title) ?: [])
                ->filter(fn ($token) => Str::length($token) > 4)
                ->unique()
                ->values();

            $hits = $keywords->filter(fn ($keyword) => str_contains($documentExcerpt, $keyword));

            $item = [
                'requirement_key' => $requirement['key'] ?? null,
                'title' => $requirement['title'] ?? 'Requirement',
                'details' => $requirement['description'] ?? null,
                'evidence' => [
                    'keyword_hits' => $hits->values()->all(),
                ],
            ];

            if ($keywords->isNotEmpty() && $hits->count() >= max(1, (int) floor($keywords->count() / 3))) {
                $matched[] = $item;
            } else {
                $missing[] = $item;
            }
        }

        return [
            'matched_requirements' => $matched,
            'missing_requirements' => $missing,
            'unclear_items' => [],
            'extracted_sections' => collect($payload['retrieved_chunks'] ?? [])->pluck('content')->take(3)->values()->all(),
            'neutral_summary' => sprintf(
                'The submitted document aligns with %d identified requirements and has %d requirements that need additional supporting content or clearer evidence.',
                count($matched),
                count($missing),
            ),
        ];
    }
}
