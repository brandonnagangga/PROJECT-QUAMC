# QUAMC AI + RAG Task

## Project

QUAMC means **Quality Assurance Management Center**.

This project already has a working non-AI Laravel system. The goal is to extend it carefully with AI-assisted document retrieval and comparison, without rewriting the whole platform.

## Main Objective

Integrate a production-ready AI and RAG workflow into the existing Laravel application so the system can:

1. store and index standard/reference PDFs
2. accept submitted/local PDFs
3. retrieve relevant standard content
4. compare submitted content against the standard using AI
5. return neutral structured findings
6. let Laravel business logic compute the final score and status

## Required Flow

1. A reference standard PDF is uploaded and indexed.
2. A submitted PDF is uploaded and indexed.
3. Retrieval fetches the most relevant standard chunks using metadata filters and vector search.
4. Augmentation assembles the context packet for comparison.
5. AI returns JSON-only neutral findings.
6. QUAMC business logic computes weighted scoring and final status.
7. Results are shown in the Laravel UI.

## Current Architecture Direction

### Laravel business data

- MySQL remains the system of record for:
  - users
  - programs
  - areas
  - sub-areas
  - standards metadata
  - rubrics
  - evaluations
  - findings
  - workflow state

### Retrieval infrastructure

- Qdrant Cloud is used for vector search
- Redis is the preferred cache/queue layer when enabled
- PDFs remain in Laravel-managed storage

### Code organization

- `app/Rag/Retrieval`
- `app/Rag/Augmentation`
- `app/Rag/AI`
- `app/Rag/Quamc`
- `app/Jobs/Documents`
- `app/Jobs/Evaluations`
- `app/Actions/Quamc`
- `app/Prompts/Quamc`

## Near-Term Implementation Tasks

1. add a `VectorStoreInterface`
2. keep the local vector store as fallback
3. implement a `QdrantVectorStore`
4. push chunk embeddings into Qdrant during ingestion
5. retrieve from Qdrant during document analysis
6. add cache strategy for extraction, embeddings, retrieval payloads, and evaluation reruns
7. add rubric/version-aware filtering
8. harden evaluation history and result views

## Qdrant Collection Assumptions

- Collection name: `quamc_standards`
- Search mode: hybrid search
- Dense vector:
  - name: `dense`
  - dimensions: `1536`
  - metric: `Cosine`
- Sparse vector:
  - name: `sparse`
  - IDF enabled

## Qdrant Payload Fields

Core payload fields expected by retrieval:

- `standard_id`
- `area_id`
- `sub_area_id`
- `doc_type`
- `is_active`
- `version`
- `program_id`
- `cycle_id`

## Important Boundary

- AI must not decide final pass/fail or institutional judgment.
- AI must only return structured neutral analysis.
- Laravel must compute final scoring and workflow status.
