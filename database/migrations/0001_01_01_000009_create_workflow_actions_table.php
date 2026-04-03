<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('actor_id')->constrained('users')->cascadeOnDelete();
            $table->string('action'); // submit | approve | return | forward | archive
            $table->string('from_status');
            $table->string('to_status');
            $table->text('comment')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();

            $table->index(['document_id', 'acted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_actions');
    }
};
