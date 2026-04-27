<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_item_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('response_id')
                ->nullable()
                ->constrained('area_item_responses')
                ->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cycle_id')->nullable()->constrained('accreditation_cycles')->nullOnDelete();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('original_filename');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size_bytes');
            $table->string('mime_type')->nullable();
            $table->enum('scan_status', ['pending', 'clean', 'infected'])->default('pending');

            $table->timestamps();
            $table->index(['area_item_id', 'program_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_item_files');
    }
};
