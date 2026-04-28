<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('area_note_replies')) {
            Schema::create('area_note_replies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('area_note_id')->constrained('area_notes')->cascadeOnDelete();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->text('message');
                $table->timestamps();

                $table->index('area_note_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('area_note_replies');
    }
};
