<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Sub-area this document belongs to (replaces area_item_id)
            $table->foreignId('sub_area_id')->constrained()->cascadeOnDelete();

            // Which program's evidence this is (areas are shared, programs are not)
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();

            // Fixed 3-type enum — always Input, Process, or Outcome
            $table->enum('doc_type', ['input', 'process', 'outcome']);

            $table->foreignUuid('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('status')->default('draft');
            // Status: draft | pending_review | approved | returned | archived
            $table->integer('current_version')->default(1);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['sub_area_id', 'program_id', 'doc_type']);
            $table->index(['sub_area_id', 'status']);
            // A sub_area + program + doc_type combination should only have ONE document
            // (multiple versions tracked via document_versions table)
            $table->unique(['sub_area_id', 'program_id', 'doc_type'], 'unique_document_slot');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
