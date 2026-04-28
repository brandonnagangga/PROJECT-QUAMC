# Requirements Document

## Introduction

This document specifies the requirements for integrating AI-powered Retrieval-Augmented Generation (RAG) capabilities into the existing QUAMC (Quality Assurance Management Center) Laravel application. The integration extends the current system to support intelligent document comparison between submitted PDFs and reference standard PDFs using vector search and AI analysis, while preserving all existing document management, versioning, and approval workflows.

## Glossary

- **QUAMC_System**: The Quality Assurance Management Center Laravel application
- **Standard_PDF**: A reference document containing accreditation standards or requirements
- **Submitted_PDF**: A document uploaded by users for evaluation against standards
- **Document_Chunk**: A segment of extracted text from a PDF, sized for embedding and retrieval
- **Vector_Store**: The Qdrant Cloud service storing document embeddings for semantic search
- **Embedding**: A numerical vector representation of text content (1536 dimensions)
- **RAG_Pipeline**: The complete workflow of retrieval, augmentation, and AI comparison
- **Evaluation_Result**: The structured output containing matched requirements, missing items, and neutral findings
- **Ingestion_Job**: An asynchronous process that extracts, chunks, embeds, and indexes document content
- **Comparison_Job**: An asynchronous process that retrieves relevant chunks and performs AI analysis
- **AI_Client**: The service responsible for sending prompts and receiving structured JSON responses
- **Metadata_Filter**: Query constraints based on standard_id, area_id, program_id, cycle_id, version, and is_active
- **Rubric**: A scoring framework defining criteria and weights for evaluation
- **Neutral_Finding**: An objective observation without pass/fail judgment or institutional bias
- **Business_Logic_Layer**: Laravel services and actions that compute scores and workflow status
- **Hybrid_Search**: Vector search combining dense embeddings (semantic) and sparse vectors (keyword)

## Requirements

### Requirement 1: Document Ingestion

**User Story:** As a system administrator, I want standard PDFs and submitted PDFs to be automatically processed and indexed, so that they can be compared using semantic search.

#### Acceptance Criteria

1. WHEN a Standard_PDF is uploaded, THE Ingestion_Job SHALL extract text from the PDF
2. WHEN a Submitted_PDF is uploaded, THE Ingestion_Job SHALL extract text from the PDF
3. WHEN text extraction completes, THE Ingestion_Job SHALL chunk the extracted text into Document_Chunks
4. WHEN chunking completes, THE Ingestion_Job SHALL generate Embeddings for each Document_Chunk
5. WHERE the document is a Standard_PDF, THE Ingestion_Job SHALL index the Document_Chunks into the Vector_Store with Metadata_Filters
6. THE Ingestion_Job SHALL execute asynchronously without blocking HTTP requests
7. WHEN ingestion fails at any step, THE Ingestion_Job SHALL log the error and mark the document status as failed

### Requirement 2: Vector Storage and Retrieval

**User Story:** As a developer, I want a flexible vector storage interface, so that the system can use Qdrant Cloud in production and fall back to local storage in development.

#### Acceptance Criteria

1. THE QUAMC_System SHALL define a VectorStoreInterface with methods for indexing and retrieval
2. THE QUAMC_System SHALL implement a QdrantVectorStore class conforming to VectorStoreInterface
3. THE QUAMC_System SHALL implement a LocalVectorStore class conforming to VectorStoreInterface for fallback
4. WHEN indexing Document_Chunks, THE QdrantVectorStore SHALL store dense vectors with 1536 dimensions using Cosine metric
5. WHEN indexing Document_Chunks, THE QdrantVectorStore SHALL store sparse vectors with IDF enabled
6. WHEN indexing Document_Chunks, THE QdrantVectorStore SHALL include payload fields: standard_id, area_id, sub_area_id, doc_type, is_active, version, program_id, cycle_id
7. THE QdrantVectorStore SHALL connect to the collection named "quamc_standards"
8. THE QdrantVectorStore SHALL load connection credentials from environment variables

### Requirement 3: Metadata-Filtered Retrieval

**User Story:** As a quality assurance coordinator, I want document comparisons to only retrieve relevant standard sections, so that evaluations are accurate and contextually appropriate.

#### Acceptance Criteria

1. WHEN retrieving Document_Chunks, THE QUAMC_System SHALL apply Metadata_Filters before semantic ranking
2. THE QUAMC_System SHALL filter by standard_id when a specific standard is targeted
3. THE QUAMC_System SHALL filter by area_id and sub_area_id when evaluating area-specific submissions
4. THE QUAMC_System SHALL filter by program_id when program-specific standards exist
5. THE QUAMC_System SHALL filter by cycle_id when cycle-specific standards exist
6. THE QUAMC_System SHALL filter by is_active equals true to exclude inactive standards
7. THE QUAMC_System SHALL filter by version to match the current standard version
8. WHEN multiple filters are specified, THE QUAMC_System SHALL apply all filters using AND logic

### Requirement 4: Hybrid Search Execution

**User Story:** As a system user, I want document retrieval to consider both semantic meaning and keyword matches, so that relevant standard sections are not missed.

#### Acceptance Criteria

1. WHEN performing retrieval, THE Vector_Store SHALL execute Hybrid_Search combining dense and sparse vectors
2. THE Vector_Store SHALL rank results by combined semantic similarity and keyword relevance
3. WHEN no results match the Metadata_Filters, THE Vector_Store SHALL return an empty result set
4. THE Vector_Store SHALL return the top N most relevant Document_Chunks where N is configurable
5. THE Vector_Store SHALL include chunk text, metadata, and relevance scores in results

### Requirement 5: Evaluation Workflow Orchestration

**User Story:** As a program director, I want document evaluations to run in the background, so that I can continue working while analysis completes.

#### Acceptance Criteria

1. WHEN a user requests document evaluation, THE QUAMC_System SHALL dispatch a Comparison_Job asynchronously
2. THE Comparison_Job SHALL retrieve relevant Document_Chunks using Metadata_Filters and Hybrid_Search
3. WHEN retrieval completes, THE Comparison_Job SHALL assemble context from retrieved chunks
4. WHEN context assembly completes, THE Comparison_Job SHALL invoke the AI_Client with the assembled context
5. WHEN AI analysis completes, THE Comparison_Job SHALL parse and validate the JSON response
6. WHEN validation succeeds, THE Comparison_Job SHALL store the Evaluation_Result in MySQL
7. WHEN validation fails, THE Comparison_Job SHALL log the error and retry up to 3 times
8. THE Comparison_Job SHALL update the evaluation status to "completed" or "failed" upon completion

### Requirement 6: AI Comparison Constraints

**User Story:** As a compliance officer, I want AI analysis to provide objective findings without making institutional judgments, so that human reviewers maintain decision authority.

#### Acceptance Criteria

1. THE AI_Client SHALL use task-specific prompts limited to comparison and extraction
2. THE AI_Client SHALL request JSON-only responses from the AI model
3. THE AI_Client SHALL NOT include scoring rules, pass/fail criteria, or policy decisions in prompts
4. THE AI_Client SHALL NOT use judgmental, biased, or institutional ranking language in prompts
5. WHEN the AI response contains non-JSON content, THE AI_Client SHALL extract the JSON portion or fail gracefully
6. THE AI_Client SHALL validate that responses contain required fields: matched_requirements, missing_requirements, unclear_items, extracted_sections, neutral_summary

### Requirement 7: Neutral Finding Storage

**User Story:** As a quality assurance reviewer, I want to see what the AI found in the submitted document compared to standards, so that I can make informed evaluation decisions.

#### Acceptance Criteria

1. THE Evaluation_Result SHALL store matched_requirements as a JSON array
2. THE Evaluation_Result SHALL store missing_requirements as a JSON array
3. THE Evaluation_Result SHALL store unclear_items as a JSON array
4. THE Evaluation_Result SHALL store extracted_sections as a JSON array
5. THE Evaluation_Result SHALL store a neutral_summary as text
6. THE Evaluation_Result SHALL NOT contain pass/fail status or final scores
7. THE Evaluation_Result SHALL include timestamps for creation and updates
8. THE Evaluation_Result SHALL reference the document_version_id and standard_id used

### Requirement 8: Business Logic Scoring

**User Story:** As a system administrator, I want final scores and pass/fail status to be computed by Laravel business logic, so that institutional policies remain under our control.

#### Acceptance Criteria

1. THE Business_Logic_Layer SHALL compute evaluation scores based on Rubric criteria
2. THE Business_Logic_Layer SHALL apply weighted scoring according to Rubric definitions
3. THE Business_Logic_Layer SHALL determine pass/fail status based on score thresholds
4. THE Business_Logic_Layer SHALL NOT delegate scoring decisions to the AI_Client
5. THE Business_Logic_Layer SHALL use Neutral_Findings as input data for scoring
6. WHEN Rubric criteria change, THE Business_Logic_Layer SHALL recompute scores without re-running AI analysis

### Requirement 9: Caching Strategy

**User Story:** As a system operator, I want expensive operations to be cached, so that the system performs efficiently and reduces API costs.

#### Acceptance Criteria

1. WHEN extracting text from a PDF, THE QUAMC_System SHALL cache the extracted text keyed by document version hash
2. WHEN generating Embeddings, THE QUAMC_System SHALL cache embeddings keyed by chunk content hash
3. WHEN retrieving Document_Chunks, THE QUAMC_System SHALL cache retrieval results keyed by query parameters and filters
4. WHEN assembling augmentation context, THE QUAMC_System SHALL cache the assembled payload keyed by document and standard version
5. THE QUAMC_System SHALL use Redis for caching when available
6. THE QUAMC_System SHALL set cache TTL to 24 hours for extraction and embeddings
7. THE QUAMC_System SHALL set cache TTL to 1 hour for retrieval results
8. WHEN a document version or standard version changes, THE QUAMC_System SHALL invalidate related cache entries

### Requirement 10: Evaluation Result Visibility

**User Story:** As a program coordinator, I want to view evaluation results within the existing document workflow, so that I can review findings without learning a new interface.

#### Acceptance Criteria

1. THE QUAMC_System SHALL display Evaluation_Results on the document detail page
2. THE QUAMC_System SHALL show matched_requirements, missing_requirements, and unclear_items in the UI
3. THE QUAMC_System SHALL display the neutral_summary prominently
4. THE QUAMC_System SHALL show the computed score and pass/fail status
5. THE QUAMC_System SHALL display evaluation timestamps and the standard version used
6. THE QUAMC_System SHALL allow users to re-run evaluation when document or standard versions change
7. WHEN evaluation is in progress, THE QUAMC_System SHALL display a loading indicator

### Requirement 11: Version-Aware Evaluation

**User Story:** As a compliance manager, I want evaluations to be tied to specific document and standard versions, so that historical evaluations remain accurate.

#### Acceptance Criteria

1. THE Evaluation_Result SHALL record the document_version_id used for analysis
2. THE Evaluation_Result SHALL record the standard version used for comparison
3. WHEN a document is updated, THE QUAMC_System SHALL NOT automatically invalidate previous Evaluation_Results
4. WHEN a standard is updated, THE QUAMC_System SHALL mark evaluations using old versions as outdated
5. THE QUAMC_System SHALL allow users to view evaluation history across versions
6. WHEN displaying evaluation results, THE QUAMC_System SHALL indicate if the evaluation uses the current version or an older version

### Requirement 12: Error Handling and Resilience

**User Story:** As a system administrator, I want the RAG pipeline to handle failures gracefully, so that partial failures don't corrupt data or block workflows.

#### Acceptance Criteria

1. WHEN PDF text extraction fails, THE Ingestion_Job SHALL log the error and mark the document as failed
2. WHEN embedding generation fails, THE Ingestion_Job SHALL retry up to 3 times with exponential backoff
3. WHEN Vector_Store indexing fails, THE Ingestion_Job SHALL log the error and queue for manual review
4. WHEN retrieval returns no results, THE Comparison_Job SHALL log a warning and return an empty Evaluation_Result
5. WHEN AI_Client receives an invalid response, THE Comparison_Job SHALL retry up to 3 times
6. WHEN all retries are exhausted, THE QUAMC_System SHALL notify administrators via the notification system
7. THE QUAMC_System SHALL continue normal document workflow operations even when RAG features fail

### Requirement 13: Architectural Preservation

**User Story:** As a development team member, I want the RAG integration to extend the existing system without rewriting core functionality, so that we minimize risk and maintain stability.

#### Acceptance Criteria

1. THE QUAMC_System SHALL preserve existing document upload workflows
2. THE QUAMC_System SHALL preserve existing document versioning behavior
3. THE QUAMC_System SHALL preserve existing approval and workflow state transitions
4. THE QUAMC_System SHALL keep RAG pipeline logic isolated in the app/Rag namespace
5. THE QUAMC_System SHALL keep Eloquent models in app/Models without RAG-specific business logic
6. THE QUAMC_System SHALL use service classes, actions, and jobs for RAG orchestration
7. THE QUAMC_System SHALL NOT place business logic in controllers
8. THE QUAMC_System SHALL maintain separation between retrieval, AI, and scoring layers

### Requirement 14: Production Readiness

**User Story:** As a DevOps engineer, I want the RAG integration to be production-ready with proper configuration management, so that deployment is secure and reliable.

#### Acceptance Criteria

1. THE QUAMC_System SHALL load all API keys and secrets from environment variables
2. THE QUAMC_System SHALL support Qdrant Cloud configuration via environment variables
3. THE QUAMC_System SHALL validate required environment variables on application startup
4. WHEN required environment variables are missing, THE QUAMC_System SHALL log a warning and disable RAG features
5. THE QUAMC_System SHALL support domain-based testing environments
6. THE QUAMC_System SHALL include health check endpoints for Vector_Store connectivity
7. THE QUAMC_System SHALL log all RAG operations with appropriate detail levels for debugging

### Requirement 15: Scalability and Performance

**User Story:** As a system architect, I want the RAG pipeline to handle large standard libraries efficiently, so that the system scales to institutional needs.

#### Acceptance Criteria

1. THE Vector_Store SHALL support indexing of 10,000+ Standard_PDFs
2. THE Metadata_Filter SHALL reduce the search space before semantic ranking
3. THE QUAMC_System SHALL limit retrieval results to a configurable maximum (default 20 chunks)
4. THE Ingestion_Job SHALL process documents in batches when multiple uploads occur
5. THE Comparison_Job SHALL timeout after 5 minutes to prevent indefinite blocking
6. WHEN retrieval takes longer than 10 seconds, THE QUAMC_System SHALL log a performance warning
7. THE QUAMC_System SHALL support horizontal scaling of queue workers for parallel job processing
