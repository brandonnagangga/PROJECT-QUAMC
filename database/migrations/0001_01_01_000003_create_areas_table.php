<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            // No program_id — areas are global across ALL programs in TCC
            $table->string('name');                     // e.g. "Area 3 — Curriculum"
            $table->tinyInteger('order_number')->default(0);
            $table->boolean('is_archived')->default(false);  // Director can archive
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete(); // always Director
            $table->timestamp('deadline_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};
