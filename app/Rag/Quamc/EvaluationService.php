<?php

namespace App\Rag\Quamc;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Evaluation;
use App\Models\EvaluationFinding;
use App\Models\Standard;
use App\Models\User;
use App\Rag\AI\AiClient;
use App\Rag\Augmentation\ContextAssembler;
use App\Rag\Retrieval\Retriever;
use Illuminate\Support\Facades\DB;

class EvaluationService
{
    public function __construct(
        protected Retriever $retriever,
        protected ContextAssembler $contextAssembler,
        protected AiClient $aiClient,
        protected RequirementMatchingService $matchingService,
        protected RubricScoringService $scoringService,
        protected NeutralSummaryService $summaryService,
    ) {}

    public function create(Document $document, Standard $standard, ?User $requestedBy = null): Evaluation
    {
        $version = $this->latestVersionOrFail($document);

        return Evaluation::create([
            'document_id' => $document->id,
            'document_version_id' => $version->id,
            'standard_id' => $standard->id,
            'rubric_id' => $standard->rubric_id,
            'requested_by' => $requestedBy?->id,
            'status' => 'queued',
        ]);
    }

    public function retrieve(Evaluation $evaluation): array
    {
        $evaluation->loadMissing(['standard.rubric.criteria', 'documentVersion.document']);

        $chunks = $this->retriever->retrieveRelevantStandardChunks($evaluation->standard, $evaluation->documentVersion);
        $context = $this->contextAssembler->assemble($evaluation, $evaluation->standard, $evaluation->documentVersion, $chunks);

        $evaluation->update([
            'status' => 'retrieved',
            'retrieval_context' => $context,
        ]);

        return $context;
    }

    public function compare(Evaluation $evaluation): array
    {
        $context = $evaluation->retrieval_context ?? $this->retrieve($evaluation);
        $response = $this->aiClient->compare($context);
        $counts = $this->matchingService->summarize($evaluation->fill(['ai_response' => $response]));

        $evaluation->update([
            'status' => 'compared',
            'ai_response' => $response,
            'matched_requirements_count' => $counts['matched'],
            'missing_requirements_count' => $counts['missing'],
            'unclear_items_count' => $counts['unclear'],
        ]);

        return $response;
    }

    public function score(Evaluation $evaluation): array
    {
        $evaluation->loadMissing('standard.rubric.criteria');
        $score = $this->scoringService->score($evaluation);

        $evaluation->update([
            'status' => 'scored',
            'total_score' => $score['total_score'],
            'max_score' => $score['max_score'],
            'status_label' => $score['status_label'],
            'scoring_breakdown' => $score,
            'neutral_summary' => $this->summaryService->build($evaluation),
        ]);

        return $score;
    }

    public function finalize(Evaluation $evaluation): Evaluation
    {
        $response = $evaluation->ai_response ?? [];

        DB::transaction(function () use ($evaluation, $response) {
            $evaluation->findings()->delete();

            $items = [
                'matched' => $response['matched_requirements'] ?? [],
                'missing' => $response['missing_requirements'] ?? [],
                'unclear' => $response['unclear_items'] ?? [],
            ];

            $sortOrder = 0;

            foreach ($items as $type => $findings) {
                foreach ($findings as $finding) {
                    EvaluationFinding::create([
                        'evaluation_id' => $evaluation->id,
                        'finding_type' => $type,
                        'requirement_key' => $finding['requirement_key'] ?? null,
                        'title' => $finding['title'] ?? 'Untitled finding',
                        'details' => $finding['details'] ?? null,
                        'evidence' => $finding['evidence'] ?? [],
                        'sort_order' => $sortOrder++,
                    ]);
                }
            }

            $evaluation->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        });

        return $evaluation->fresh(['findings', 'standard', 'documentVersion']);
    }

    protected function latestVersionOrFail(Document $document): DocumentVersion
    {
        return $document->latestVersion() ?? throw new \RuntimeException('Document has no uploaded version yet.');
    }
}
