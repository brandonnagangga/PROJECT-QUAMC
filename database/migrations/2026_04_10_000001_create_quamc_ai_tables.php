<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rubrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sub_area_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('doc_type', ['input', 'process', 'outcome'])->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('standards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sub_area_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('doc_type', ['input', 'process', 'outcome'])->nullable();
            $table->foreignUuid('rubric_id')->nullable()->constrained('rubrics')->nullOnDelete();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type')->default('application/pdf');
            $table->longText('extracted_text')->nullable();
            $table->timestamp('extracted_at')->nullable();
            $table->string('index_status')->default('pending');
            $table->text('index_error')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['sub_area_id', 'doc_type', 'is_active']);
        });

        Schema::create('rubric_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rubric_id')->constrained()->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('title');
            $table->text('description');
            $table->decimal('weight', 8, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['rubric_id', 'sort_order']);
        });

        Schema::create('document_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('chunkable');
            $table->unsignedInteger('chunk_index');
            $table->longText('content');
            $table->unsignedInteger('token_count')->default(0);
            $table->json('embedding')->nullable();
            $table->json('metadata')->nullable();
            $table->string('extracted_from')->default('text');
            $table->timestamps();

            $table->index(['chunkable_type', 'chunkable_id', 'chunk_index'], 'document_chunks_owner_index');
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('document_version_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('standard_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('rubric_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('queued');
            $table->unsignedInteger('matched_requirements_count')->default(0);
            $table->unsignedInteger('missing_requirements_count')->default(0);
            $table->unsignedInteger('unclear_items_count')->default(0);
            $table->decimal('total_score', 8, 2)->nullable();
            $table->decimal('max_score', 8, 2)->nullable();
            $table->string('status_label')->nullable();
            $table->text('neutral_summary')->nullable();
            $table->json('retrieval_context')->nullable();
            $table->json('ai_response')->nullable();
            $table->json('scoring_breakdown')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
            $table->index(['status', 'standard_id']);
        });

        Schema::create('evaluation_findings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('evaluation_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('rubric_criterion_id')->nullable()->constrained()->nullOnDelete();
            $table->string('finding_type');
            $table->string('requirement_key')->nullable();
            $table->string('title');
            $table->text('details')->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('evidence')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['evaluation_id', 'finding_type']);
        });

        Schema::table('document_versions', function (Blueprint $table) {
            $table->longText('extracted_text')->nullable()->after('scan_status');
            $table->timestamp('extracted_at')->nullable()->after('extracted_text');
            $table->string('index_status')->default('pending')->after('extracted_at');
            $table->text('index_error')->nullable()->after('index_status');
        });
    }

    public function down(): void
    {
        Schema::table('document_versions', function (Blueprint $table) {
            $table->dropColumn(['extracted_text', 'extracted_at', 'index_status', 'index_error']);
        });

        Schema::dropIfExists('evaluation_findings');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('document_chunks');
        Schema::dropIfExists('rubric_criteria');
        Schema::dropIfExists('standards');
        Schema::dropIfExists('rubrics');
    }
};
