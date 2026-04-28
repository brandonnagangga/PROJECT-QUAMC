<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Tag each document to the accreditation cycle it was created under.
            // Nullable so existing documents aren't broken.
            $table->foreignId('cycle_id')
                ->nullable()
                ->after('program_id')
                ->constrained('accreditation_cycles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['cycle_id']);
            $table->dropColumn('cycle_id');
        });
    }
};
