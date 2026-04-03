<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event'); // e.g. document.submitted
            $table->string('model_type')->nullable();
            $table->string('model_id')->nullable();
            $table->json('changes')->nullable(); // before/after values
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
