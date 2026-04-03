<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->string('name');                          // e.g. "3.1 Course Offerings"
            $table->tinyInteger('order_number')->default(0);
            $table->boolean('is_archived')->default(false);

            // Submission workflow — tracks the Dean→Director approval state
            $table->string('submission_status')->default('draft');
            // Statuses: draft | submitted_to_dean | approved_by_dean | returned_by_dean
            //           | submitted_to_director | approved | returned

            $table->timestamp('submitted_by_dean_at')->nullable(); // when Dean forwarded to Director

            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['area_id', 'submission_status']);
            $table->index('submission_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_areas');
    }
};
