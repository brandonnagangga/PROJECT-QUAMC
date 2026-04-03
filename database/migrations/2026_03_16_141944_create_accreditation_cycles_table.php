<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accreditation_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // e.g. "A.Y. 2024-2025"
            $table->string('academic_year');      // e.g. "2024-2025"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accreditation_cycles');
    }
};
