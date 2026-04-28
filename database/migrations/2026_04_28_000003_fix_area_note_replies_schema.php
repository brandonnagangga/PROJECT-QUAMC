<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The existing `area_note_replies` table was created with a stale schema
     * (missing the `area_note_id` FK column). Drop and recreate it properly.
     */
    public function up(): void
    {
        Schema::dropIfExists('area_note_replies');

        Schema::create('area_note_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_note_id')->constrained('area_notes')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->index('area_note_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_note_replies');
    }
};
