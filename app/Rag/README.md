QUAMC RAG Structure
===================

This folder keeps the AI-assisted document evaluation flow visible in one place.

Layers
------

- `Retrieval/`
  - extracts text from PDFs
  - chunks reference and submitted documents
  - builds/searches chunk vectors
- `Augmentation/`
  - assembles retrieved chunks and rubric requirements into a compact comparison payload
- `AI/`
  - builds prompts
  - calls the configured model or local heuristic fallback
  - validates JSON output
- `Quamc/`
  - applies QUAMC scoring and status rules
  - persists neutral findings and summaries

Pipeline
--------

1. `IngestDocumentPipelineJob`
2. `ExtractPdfTextJob`
3. `ChunkDocumentJob`
4. `IndexChunksJob`
5. `AnalyzeSubmittedDocument`
6. `RetrieveRelevantChunksJob`
7. `RunAiComparisonJob`
8. `ComputeScoreJob`
9. `FinalizeEvaluationJob`

Rule Boundary
-------------

- AI returns structured findings only.
- QUAMC business logic computes score and status.
- Retrieval never decides compliance.
