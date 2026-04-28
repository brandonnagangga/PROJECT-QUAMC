# Implementation Plan: QUAMC AI + RAG Integration

## Overview

This implementation plan breaks down the AI + RAG integration into discrete coding tasks. The approach follows a bottom-up strategy: establish database foundation, build core infrastructure layers (vector store, retrieval, AI), implement job pipelines, integrate with controllers, and finally add UI components.

The implementation preserves existing QUAMC workflows and isolates RAG logic in the `app/Rag` namespace. All expensive operations run asynchronously via Laravel queues.

## Tasks

- [ ] 1. Database foundation and models
  - [-] 1.1 Create database migrations for RAG tables
    - Create migration for extending `standards` table with `extracted_text`, `extracted_at`, `index_status`, `index_error`, `metadata`, `is_active` columns
    - Create migration for `document_chunks` table with polymorphic relationship
    - Create migration for `evaluations` table with foreign keys to documents, standards, rubrics
    - Create migration for `evaluation_findings` table with foreign keys to evaluations and rubric_criteria
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.1, 11.2_
  
  - [ ] 1.2 Create and configure Eloquent models
    - Extend `Standard` model with new fillable fields, casts, and `chunks()` morphMany relationship
    - Create `DocumentChunk` model with fillable fields, casts, and `chunkable()` morphTo relationship
    - Create `Evaluation` model with fillable fields, casts, relationships to Document, DocumentVersion, Standard, Rubric, User, and `findings()` hasMany relationship
    - Create `EvaluationFinding` model with fillable fields, casts, and relationship to Evaluation and RubricCriterion
    - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.1, 11.2_

- [ ] 2. Configuration files and environment setup
  - [ ] 2.1 Create vector store configuration
    - Create `config/vector_store.php` with driver selection (qdrant/local), Qdrant connection settings, and local storage path
    - Add environment variables to `.env.example`: VECTOR_STORE_DRIVER, QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION, QDRANT_TIMEOUT
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 2.2 Create AI provider configuration
    - Create `config/ai.php` with driver selection, OpenAI-compatible settings, model configuration, and timeout
    - Add environment variables to `.env.example`: AI_DRIVER, AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_TIMEOUT
    - _Requirements: 6.1, 6.2, 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 2.3 Create retrieval configuration
    - Create `config/retrieval.php` with chunk_size, chunk_overlap, top_k, embedding_dimensions, and cache TTL settings
    - Add environment variables to `.env.example`: RETRIEVAL_CHUNK_SIZE, RETRIEVAL_CHUNK_OVERLAP, RETRIEVAL_TOP_K, RETRIEVAL_EMBEDDING_DIMENSIONS
    - _Requirements: 1.3, 1.4, 4.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 3. Vector store layer implementation
  - [ ] 3.1 Create VectorStoreInterface
    - Define interface with methods: `index()`, `search()`, `delete()`, `healthCheck()`
    - Document method signatures with parameter types and return types
    - _Requirements: 2.1_
  
  - [ ] 3.2 Implement QdrantVectorStore
    - Implement VectorStoreInterface for Qdrant Cloud
    - Implement `index()` method to store dense vectors (1536 dimensions, Cosine metric) and sparse vectors (IDF enabled) with payload fields
    - Implement `search()` method with hybrid search combining dense and sparse vectors, metadata filtering, and configurable limit
    - Implement `delete()` method with metadata filter support
    - Implement `healthCheck()` method to verify Qdrant connectivity
    - Load connection settings from `config/vector_store.php`
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 4.1, 4.2, 4.5_
  
  - [ ] 3.3 Implement LocalVectorStore fallback
    - Implement VectorStoreInterface for local file-based storage
    - Implement simple cosine similarity search without external dependencies
    - Store vectors in JSON files in storage directory
    - _Requirements: 2.3_
  
  - [ ] 3.4 Create VectorStoreServiceProvider
    - Register VectorStoreInterface binding based on VECTOR_STORE_DRIVER config
    - Bind QdrantVectorStore when driver is 'qdrant'
    - Bind LocalVectorStore when driver is 'local'
    - Register service provider in `config/app.php`
    - _Requirements: 2.1, 2.2, 2.3, 14.3, 14.4_
  
  - [ ]* 3.5 Write unit tests for vector store implementations
    - Test QdrantVectorStore index, search, delete, and healthCheck methods with mocked HTTP responses
    - Test LocalVectorStore index, search, and delete methods
    - Test VectorStoreServiceProvider binding logic
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Checkpoint - Verify vector store layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Retrieval layer implementation
  - [ ] 5.1 Create DocumentChunker service
    - Implement text chunking with configurable chunk_size (default 1200) and chunk_overlap (default 200)
    - Split text by paragraph boundaries and accumulate until chunk size reached
    - Handle long paragraphs by splitting at sentence boundaries
    - Apply overlap from previous chunk
    - Generate chunk metadata with chunk_index, token_count, and extracted_from fields
    - _Requirements: 1.3, 9.1_
  
  - [ ] 5.2 Create EmbeddingService with provider abstraction
    - Implement embedding generation for text chunks
    - Support OpenAI-compatible API provider
    - Implement local sparse vector fallback
    - Cache embeddings keyed by chunk content hash with 24-hour TTL
    - _Requirements: 1.4, 9.2, 9.5, 9.6_
  
  - [ ] 5.3 Create MetadataFilter builder
    - Implement filter building for Qdrant queries
    - Support filters: is_active, standard_id, version, program_id, cycle_id, area_id, sub_area_id
    - Apply filters with AND logic
    - Optimize filter order for performance (is_active first, then standard_id, etc.)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [ ] 5.4 Implement PDF text extraction
    - Use PDF parser library (e.g., Smalot\PdfParser) to extract text from PDF files
    - Cache extracted text keyed by document version hash with 24-hour TTL
    - Handle extraction errors gracefully (corrupted PDFs, password-protected, unsupported versions)
    - _Requirements: 1.1, 1.2, 9.1, 9.5, 9.6, 12.1_
  
  - [ ]* 5.5 Write unit tests for retrieval layer
    - Test DocumentChunker with various text inputs (empty, short, long, multi-paragraph)
    - Test chunk size, overlap, and boundary handling
    - Test MetadataFilter building with single and multiple criteria
    - Test PDF extraction with sample PDF files
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 6. Augmentation layer implementation
  - [ ] 6.1 Create ContextAssembler service
    - Implement context assembly from retrieved chunks
    - Format retrieved chunks into comparison context
    - Format rubric requirements for AI consumption
    - Build compact payloads to minimize token usage
    - Cache assembled context keyed by document and standard version with 1-hour TTL
    - _Requirements: 5.3, 9.4, 9.5, 9.7_
  
  - [ ]* 6.2 Write unit tests for ContextAssembler
    - Test context assembly with various chunk counts
    - Test rubric formatting
    - Test payload compaction
    - _Requirements: 5.3_

- [ ] 7. AI layer implementation
  - [ ] 7.1 Create AiClient with OpenAI-compatible provider
    - Implement HTTP client for OpenAI-compatible API
    - Send chat completion requests with JSON-only response format
    - Handle API errors, timeouts, and rate limits
    - Implement retry logic (3 attempts with exponential backoff)
    - Load configuration from `config/ai.php`
    - _Requirements: 6.1, 6.2, 12.5, 14.1_
  
  - [ ] 7.2 Create PromptBuilder for comparison prompts
    - Build task-specific prompts limited to comparison and extraction
    - Include system message enforcing neutral, objective analysis
    - Format user message with standard requirements, submitted document excerpt, and retrieved context
    - Exclude scoring rules, pass/fail criteria, and policy decisions from prompts
    - Use neutral language without judgmental or institutional bias
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 7.3 Create ResponseParser with validation
    - Parse AI responses and extract JSON content
    - Handle non-JSON content by extracting JSON portion or failing gracefully
    - Validate required fields: matched_requirements, missing_requirements, unclear_items, extracted_sections, neutral_summary
    - Validate structure of each requirement (requirement_key, title, details, evidence)
    - _Requirements: 6.2, 6.5, 6.6_
  
  - [ ] 7.4 Implement heuristic fallback
    - Create fallback comparison logic using keyword matching when AI unavailable
    - Generate basic findings structure
    - Mark evaluation with `ai_fallback: true` flag
    - Log warning for administrator review
    - _Requirements: 12.4, 12.7_
  
  - [ ]* 7.5 Write unit tests for AI layer
    - Test PromptBuilder with various inputs
    - Test ResponseParser with valid and invalid JSON responses
    - Test AiClient with mocked HTTP responses
    - Test heuristic fallback logic
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Checkpoint - Verify core RAG layers
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. QUAMC layer implementation
  - [ ] 9.1 Create EvaluationService
    - Implement `create()` method to create evaluation records
    - Implement `updateStatus()` method to update evaluation status and error messages
    - Implement `storeRetrievalContext()` method to store retrieved chunks in evaluation record
    - Implement `storeAiResponse()` method to store AI response in evaluation record
    - Implement method to retrieve evaluation history
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 9.2 Create RubricScoringService
    - Implement `computeScore()` method to apply rubric criteria to findings
    - Implement `determineStatus()` method to determine pass/fail based on score thresholds
    - Implement `mapFindingsToCriteria()` method to map AI findings to rubric criteria
    - Compute weighted scores according to rubric definitions
    - Generate scoring breakdown JSON
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 9.3 Write unit tests for QUAMC layer
    - Test EvaluationService create, updateStatus, storeRetrievalContext, storeAiResponse methods
    - Test RubricScoringService computeScore with various rubric configurations
    - Test determineStatus at threshold boundaries
    - Test mapFindingsToCriteria with matched, missing, and unclear findings
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 10. Document ingestion job pipeline
  - [ ] 10.1 Create IngestDocumentPipelineJob orchestrator
    - Implement job to orchestrate the ingestion pipeline
    - Dispatch ExtractPdfTextJob as first step
    - Handle pipeline failures and update document status
    - Configure job with retry settings (3 attempts, exponential backoff, 5-minute timeout)
    - _Requirements: 1.6, 1.7, 12.1, 12.2, 12.3, 15.4_
  
  - [ ] 10.2 Create ExtractPdfTextJob
    - Extract text from PDF using PDF parser
    - Store extracted text in `standards.extracted_text` column
    - Update `extracted_at` timestamp
    - Cache extracted text keyed by document version hash
    - Chain ChunkDocumentJob on success
    - Handle extraction errors and mark document as failed
    - _Requirements: 1.1, 1.2, 9.1, 9.5, 9.6, 12.1_
  
  - [ ] 10.3 Create ChunkDocumentJob
    - Use DocumentChunker to split extracted text into chunks
    - Save DocumentChunk records to database with chunk_index, content, token_count, and metadata
    - Chain GenerateEmbeddingsJob on success
    - _Requirements: 1.3_
  
  - [ ] 10.4 Create GenerateEmbeddingsJob
    - Use EmbeddingService to generate embeddings for each chunk
    - Update DocumentChunk records with embedding data
    - Cache embeddings keyed by chunk content hash
    - Chain IndexChunksJob on success
    - Retry on failure (3 attempts with exponential backoff)
    - _Requirements: 1.4, 9.2, 9.5, 9.6, 12.2_
  
  - [ ] 10.5 Create IndexChunksJob
    - Use VectorStoreInterface to index chunks into vector store
    - Include dense vectors, sparse vectors, and payload metadata (standard_id, area_id, sub_area_id, doc_type, is_active, version, program_id, cycle_id)
    - Update `standards.index_status` to 'completed' or 'failed'
    - Log errors and queue for manual review on failure
    - _Requirements: 1.5, 2.4, 2.5, 2.6, 12.3_
  
  - [ ]* 10.6 Write integration tests for ingestion pipeline
    - Test full pipeline execution from PDF upload to vector store indexing
    - Test pipeline failure handling at each step
    - Test retry logic for transient failures
    - Mock external services (vector store, embedding provider)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 12.1, 12.2, 12.3_

- [ ] 11. Evaluation job pipeline
  - [ ] 11.1 Create RetrieveRelevantChunksJob
    - Build metadata filters using MetadataFilter based on document context (standard_id, area_id, sub_area_id, program_id, cycle_id, is_active, version)
    - Generate query embedding for submitted document
    - Use VectorStoreInterface to execute hybrid search with filters and configurable limit
    - Store retrieval context in evaluation record using EvaluationService
    - Chain RunAiComparisonJob on success
    - Log warning and return empty result if no chunks found
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 9.3, 9.5, 9.7, 12.4, 15.2, 15.3, 15.6_
  
  - [ ] 11.2 Create RunAiComparisonJob
    - Use ContextAssembler to assemble context from retrieved chunks
    - Use PromptBuilder to build comparison prompt
    - Use AiClient to send prompt and receive JSON response
    - Use ResponseParser to parse and validate response
    - Store AI response in evaluation record using EvaluationService
    - Chain ComputeScoreJob on success
    - Retry on failure (3 attempts), fall back to heuristic if all retries exhausted
    - _Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 12.5_
  
  - [ ] 11.3 Create ComputeScoreJob
    - Use RubricScoringService to compute scores from AI findings
    - Map findings to rubric criteria
    - Compute weighted scores
    - Determine pass/fail status
    - Create EvaluationFinding records for each finding
    - Store scoring breakdown in evaluation record
    - Chain FinalizeEvaluationJob on success
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 11.4 Create FinalizeEvaluationJob
    - Update evaluation status to 'completed' or 'failed'
    - Set completed_at timestamp
    - Notify user via existing notification system
    - _Requirements: 5.8, 12.6_
  
  - [ ]* 11.5 Write integration tests for evaluation pipeline
    - Test full pipeline execution from evaluation request to completion
    - Test pipeline failure handling at each step
    - Test retry logic and fallback mechanisms
    - Mock external services (vector store, AI provider)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 12.4, 12.5, 12.6_

- [ ] 12. Checkpoint - Verify job pipelines
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Action classes for orchestration
  - [ ] 13.1 Create AnalyzeSubmittedDocument action
    - Accept Document and Standard as parameters
    - Create Evaluation record using EvaluationService
    - Dispatch evaluation job chain asynchronously
    - Return evaluation ID to caller
    - _Requirements: 5.1, 5.2_
  
  - [ ] 13.2 Create CompareAgainstStandard action
    - Coordinate retrieval, AI comparison, and scoring
    - Handle version-aware evaluation (document_version_id and standard version)
    - _Requirements: 11.1, 11.2_
  
  - [ ] 13.3 Create SaveEvaluationResult action
    - Persist evaluation results to database
    - Create EvaluationFinding records
    - Update evaluation counts (matched_requirements_count, missing_requirements_count, unclear_items_count)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [ ]* 13.4 Write unit tests for action classes
    - Test AnalyzeSubmittedDocument with valid inputs
    - Test CompareAgainstStandard with version tracking
    - Test SaveEvaluationResult with various finding types
    - _Requirements: 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.1, 11.2_

- [ ] 14. Controller integration
  - [ ] 14.1 Add standard indexing trigger to StandardController
    - Dispatch IngestDocumentPipelineJob when standard PDF is uploaded
    - Preserve existing upload workflow
    - _Requirements: 1.6, 13.1, 13.2_
  
  - [ ] 14.2 Create DocumentEvaluationController
    - Implement `store()` method to request evaluation (POST /api/documents/{document}/evaluations)
    - Use AnalyzeSubmittedDocument action to create evaluation and dispatch jobs
    - Implement `show()` method to retrieve evaluation results (GET /api/evaluations/{evaluation})
    - Implement `index()` method to list evaluations for a document (GET /api/documents/{document}/evaluations)
    - Implement `rerun()` method to re-run evaluation (POST /api/evaluations/{evaluation}/rerun)
    - Apply authorization policies using existing DocumentPolicy
    - _Requirements: 5.1, 10.6, 11.3, 11.4, 11.5, 11.6, 13.1, 13.2, 13.7_
  
  - [ ] 14.3 Create health check endpoint
    - Implement GET /api/health/rag endpoint
    - Check vector store connectivity using healthCheck() method
    - Check AI provider availability
    - Check cache connectivity
    - Check queue status (pending jobs, failed jobs)
    - Return JSON response with status and latency metrics
    - _Requirements: 14.6_
  
  - [ ]* 14.4 Write feature tests for controller endpoints
    - Test standard upload triggers ingestion pipeline
    - Test evaluation request creates evaluation record and dispatches jobs
    - Test evaluation retrieval returns correct data
    - Test re-evaluation invalidates cache and creates new evaluation
    - Test health check endpoint returns correct status
    - _Requirements: 1.6, 5.1, 10.6, 11.3, 11.4, 11.5, 11.6, 13.1, 13.2, 14.6_

- [ ] 15. UI integration with React/Inertia
  - [ ] 15.1 Create EvaluationResults component
    - Display matched_requirements, missing_requirements, and unclear_items
    - Display neutral_summary prominently
    - Display computed score and pass/fail status
    - Display evaluation timestamps and standard version used
    - Show loading indicator when evaluation is in progress
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7_
  
  - [ ] 15.2 Add evaluation section to document detail page
    - Integrate EvaluationResults component into existing document detail page
    - Add "Request Evaluation" button
    - Add "Re-run Evaluation" button (visible when document or standard version changes)
    - Show evaluation history with version information
    - Indicate if evaluation uses current version or older version
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.3, 11.4, 11.5, 11.6_
  
  - [ ] 15.3 Add evaluation status indicators
    - Show status badge (pending, in_progress, completed, failed) on document list
    - Show status badge on document detail page
    - Update status in real-time using polling or websockets
    - _Requirements: 10.7_

- [ ] 16. Caching implementation
  - [ ] 16.1 Implement cache strategy for PDF extraction
    - Cache extracted text keyed by document version hash
    - Set TTL to 24 hours
    - Invalidate cache when document version changes
    - _Requirements: 9.1, 9.5, 9.6, 9.8_
  
  - [ ] 16.2 Implement cache strategy for embeddings
    - Cache embeddings keyed by chunk content hash
    - Set TTL to 24 hours
    - Content-addressed caching (no invalidation needed)
    - _Requirements: 9.2, 9.5, 9.6_
  
  - [ ] 16.3 Implement cache strategy for retrieval
    - Cache retrieval results keyed by query parameters and filters
    - Set TTL to 1 hour
    - Invalidate cache when standard version changes
    - _Requirements: 9.3, 9.5, 9.7, 9.8_
  
  - [ ] 16.4 Implement cache strategy for augmentation context
    - Cache assembled context keyed by document and standard version
    - Set TTL to 1 hour
    - Invalidate cache when document or standard version changes
    - _Requirements: 9.4, 9.5, 9.7, 9.8_
  
  - [ ]* 16.5 Write tests for cache invalidation logic
    - Test cache invalidation on document version change
    - Test cache invalidation on standard version change
    - Test cache hit rate monitoring
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 17. Checkpoint - Verify end-to-end integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Error handling and resilience
  - [ ] 18.1 Implement error handling in ingestion pipeline
    - Handle PDF extraction failures (corrupted, password-protected, unsupported)
    - Handle embedding generation failures with retry logic
    - Handle vector store indexing failures with manual review queue
    - Log all errors with context
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 18.2 Implement error handling in evaluation pipeline
    - Handle retrieval failures (no results, vector store unavailable)
    - Handle AI provider failures with retry and fallback
    - Handle scoring failures with default scoring
    - Notify administrators via notification system when all retries exhausted
    - _Requirements: 12.4, 12.5, 12.6_
  
  - [ ] 18.3 Ensure workflow preservation on RAG failures
    - Verify existing document upload workflows continue when RAG features fail
    - Verify existing versioning behavior preserved
    - Verify existing approval workflows preserved
    - _Requirements: 12.7, 13.1, 13.2, 13.3_
  
  - [ ]* 18.4 Write tests for error handling scenarios
    - Test ingestion pipeline with corrupted PDF
    - Test evaluation pipeline with vector store unavailable
    - Test evaluation pipeline with AI provider unavailable
    - Test fallback mechanisms
    - Test notification delivery on failures
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 19. Production readiness
  - [ ] 19.1 Validate environment variable configuration
    - Implement startup validation for required environment variables
    - Log warnings when required variables missing
    - Disable RAG features gracefully when configuration incomplete
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 19.2 Implement logging for RAG operations
    - Log all ingestion pipeline steps with appropriate detail levels
    - Log all evaluation pipeline steps with appropriate detail levels
    - Log performance warnings (retrieval > 10 seconds, evaluation > 5 minutes)
    - Log cache hit rates
    - _Requirements: 14.7, 15.6_
  
  - [ ] 19.3 Create Qdrant collection setup script
    - Create artisan command to initialize Qdrant collection
    - Configure collection with dense vector (1536 dimensions, Cosine metric) and sparse vector (IDF enabled)
    - Create indexes for payload fields
    - Verify collection schema
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 15.1_
  
  - [ ]* 19.4 Write deployment documentation
    - Document environment variable setup
    - Document Qdrant Cloud provisioning steps
    - Document collection initialization
    - Document queue worker configuration
    - Document monitoring and alerting setup
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6, 14.7_

- [ ] 20. Final checkpoint and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- The implementation preserves existing QUAMC workflows and isolates RAG logic
- All expensive operations run asynchronously via Laravel queues
- External services (Qdrant, AI provider) are mocked in tests
- The system fails gracefully when RAG features are unavailable
