<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tracks the submission state of an entire Area for a given program+cycle.
        // Submit to Dean button lives at the AREA level → locks all items in all sub-areas.
        Schema::create('area_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cycle_id')->nullable()->constrained('accreditation_cycles')->nullOnDelete();

            // draft → submitted → returned → approved
            $table->string('status')->default('draft');

            $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();

            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('return_notes')->nullable();

            $table->timestamps();
            $table->unique(['area_id', 'program_id', 'cycle_id'], 'unique_area_submission');
            $table->index(['program_id', 'cycle_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_submissions');
    }
};
