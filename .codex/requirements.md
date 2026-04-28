# QUAMC AI + RAG Requirements

## Functional Requirements

1. The system must support a reference standard PDF and a submitted PDF.
2. The system must extract text from both document types.
3. The system must chunk extracted text for retrieval.
4. The system must generate embeddings compatible with the configured vector collection.
5. The system must index standard chunks into Qdrant.
6. The system must retrieve relevant chunks using metadata filters and vector search.
7. The system must support neutral AI comparison with JSON-only output.
8. The system must store:
   - matched requirements
   - missing requirements
   - unclear items
   - extracted sections
   - neutral summary
9. Laravel must compute final score and status from business rules.
10. Evaluation results must be visible from the existing QUAMC document workflow.

## Architectural Requirements

1. Do not rewrite the whole Laravel application.
2. Preserve existing document upload, versioning, and approval behavior.
3. Keep business logic out of controllers where possible.
4. Use service classes, actions, and jobs for orchestration.
5. Keep Eloquent models in `app/Models`.
6. Keep RAG pipeline logic grouped under `app/Rag`.
7. Retrieval, AI, and QUAMC scoring must remain separate layers.

## AI Requirements

1. AI must use short, efficient, task-specific prompts.
2. AI responses must be JSON-only whenever possible.
3. AI must avoid judgmental, biased, or institutional ranking language.
4. AI must not invent scoring rules.
5. AI must not decide pass/fail or policy outcomes.

## Retrieval Requirements

1. Retrieval must not rely on model memory.
2. The application must own the memory through stored chunks and vector indexing.
3. Retrieval should use metadata narrowing before semantic ranking.
4. Retrieval should be ready for large standard libraries such as `10,000+` PDFs.
5. Retrieval should support hybrid search for semantic and keyword relevance.

## Storage Requirements

1. MySQL is the system of record.
2. Qdrant is the vector retrieval store.
3. Redis should be used for caching and queue-related acceleration when enabled.
4. Standards should support active/inactive and version-aware handling.

## Performance Requirements

1. Document ingestion must run asynchronously.
2. Evaluation steps should run in jobs/chains, not long blocking controller requests.
3. Expensive steps should be cacheable:
   - extracted text
   - embeddings
   - retrieval results
   - assembled augmentation payloads
4. The system should avoid recomputing evaluation results when the document version and standard version have not changed.

## Future-Ready Requirements

1. The system should support rubric versioning.
2. The system should support accreditation cycle filtering.
3. The system should support program-aware standards when needed.
4. The system should support section-aware chunk metadata later without major redesign.
5. The vector store implementation should remain replaceable through an interface.

## Deployment Requirements

1. The system should be production-ready for domain-based testing.
2. Secrets must be loaded from environment variables.
3. Qdrant Cloud configuration must be supported.
4. Local fallback retrieval should remain available for development or degraded mode.
