<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->string('role_type'); // area_coord | program_coord
            $table->integer('academic_year');
            $table->timestamps();
            $table->unique(['user_id', 'area_id', 'academic_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_assignments');
    }
};
