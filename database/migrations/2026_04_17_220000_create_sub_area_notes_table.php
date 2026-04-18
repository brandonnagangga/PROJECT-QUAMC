<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_area_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_area_id')->constrained('sub_areas')->cascadeOnDelete();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->text('notes');
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // One note per sub_area + program combo
            $table->unique(['sub_area_id', 'program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_area_notes');
    }
};
