<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            // 'general' = dean's general notes; 'return' = auto-created on return action
            $table->enum('type', ['general', 'return'])->default('general');
            $table->text('content');
            $table->timestamps();

            $table->index(['area_id', 'program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_notes');
    }
};
