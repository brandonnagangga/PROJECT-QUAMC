<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sub_area_note_replies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sub_area_id');
            $table->unsignedBigInteger('program_id');
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->foreign('sub_area_id')->references('id')->on('sub_areas')->cascadeOnDelete();
            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_area_note_replies');
    }
};
