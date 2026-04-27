<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_item_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cycle_id')->nullable()->constrained('accreditation_cycles')->nullOnDelete();

            // Rating 0–5
            $table->tinyInteger('rating')->nullable();

            // Narrative (Lexical serialised JSON + plain-text mirror for search/export)
            $table->longText('content_json')->nullable();
            $table->text('content_text')->nullable();

            // Status: draft → submitted_to_dean → returned | approved
            $table->string('status')->default('draft');

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One response per item per program per cycle
            $table->unique(['area_item_id', 'program_id', 'cycle_id'], 'unique_item_response');
            $table->index(['program_id', 'cycle_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_item_responses');
    }
};
