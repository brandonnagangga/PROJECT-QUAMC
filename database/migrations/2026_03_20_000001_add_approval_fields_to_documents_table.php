<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Dean-level approval per document slot
            $table->string('approval_status')->default('pending')
                ->after('status');
            // approval_status: pending | approved | rejected
            $table->text('rejection_reason')->nullable()->after('approval_status');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete()
                ->after('rejection_reason');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        // Also make document_versions track scan_status if not already (migration is idempotent guard)
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['approval_status', 'rejection_reason', 'approved_by', 'approved_at']);
        });
    }
};
