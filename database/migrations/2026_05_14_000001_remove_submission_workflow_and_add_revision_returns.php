<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * QUAMC workflow refactor (May 2026):
     *  - Dean and Director no longer "submit/approve" content. Both edit evidence freely
     *    alongside coordinators. The only review action is RETURN with comment.
     *  - Returns target: sub-areas, items, or sub-items (sub-items are AreaItem rows
     *    with parent_item_id set, so they share the polymorphic `item` type).
     *  - Resolution rules (enforced in controller):
     *      • Director-returned → only area-coordinator / program-coordinator can resolve
     *      • Dean-returned     → any role can resolve
     */
    public function up(): void
    {
        // ── 1. New polymorphic returns table ──────────────────────────────
        if (!Schema::hasTable('revision_returns')) {
            Schema::create('revision_returns', function (Blueprint $table) {
                $table->id();
                $table->morphs('returnable');                              // returnable_type + returnable_id
                $table->foreignId('sub_area_id')->constrained()->cascadeOnDelete();
                $table->foreignId('program_id')->constrained()->cascadeOnDelete();
                $table->foreignId('cycle_id')->nullable()->constrained('accreditation_cycles')->nullOnDelete();
                $table->foreignUuid('returned_by')->constrained('users')->cascadeOnDelete();
                $table->string('returned_by_role', 32);                    // 'dean' | 'director'
                $table->text('comment')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->foreignUuid('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['sub_area_id', 'program_id', 'resolved_at'], 'rr_subarea_prog_resolved_idx');
                $table->index(['program_id', 'resolved_at'], 'rr_prog_resolved_idx');
            });
        }

        // ── 2. Drop the entire submission table ───────────────────────────
        Schema::dropIfExists('area_submissions');

        // ── 3. Drop submission-workflow columns from sub_areas ────────────
        if (Schema::hasTable('sub_areas')) {
            Schema::table('sub_areas', function (Blueprint $table) {
                if (Schema::hasColumn('sub_areas', 'submission_status')) {
                    // Drop the standalone index on submission_status if it exists
                    try { $table->dropIndex('sub_areas_submission_status_index'); } catch (\Throwable $e) {}
                    $table->dropColumn('submission_status');
                }
                if (Schema::hasColumn('sub_areas', 'submitted_by_dean_at')) {
                    $table->dropColumn('submitted_by_dean_at');
                }
            });

            // The composite (area_id, submission_status) index is collapsed by MySQL into
            // (area_id) once submission_status is gone — that's fine, it still supports the
            // area_id FK. We deliberately don't drop it because MySQL won't allow it without
            // first creating a replacement index on area_id.
        }

        // ── 4. Drop document approval columns ─────────────────────────────
        if (Schema::hasTable('documents')) {
            Schema::table('documents', function (Blueprint $table) {
                if (Schema::hasColumn('documents', 'approved_by')) {
                    try { $table->dropForeign(['approved_by']); } catch (\Throwable $e) {}
                }
            });
            Schema::table('documents', function (Blueprint $table) {
                $cols = [];
                foreach (['approval_status', 'rejection_reason', 'approved_by', 'approved_at'] as $c) {
                    if (Schema::hasColumn('documents', $c)) $cols[] = $c;
                }
                if (!empty($cols)) $table->dropColumn($cols);
            });
        }
    }

    public function down(): void
    {
        // Restore submission columns on sub_areas
        if (Schema::hasTable('sub_areas')) {
            Schema::table('sub_areas', function (Blueprint $table) {
                if (!Schema::hasColumn('sub_areas', 'submission_status')) {
                    $table->string('submission_status')->default('draft')->after('is_archived');
                }
                if (!Schema::hasColumn('sub_areas', 'submitted_by_dean_at')) {
                    $table->timestamp('submitted_by_dean_at')->nullable()->after('submission_status');
                }
                $table->index(['area_id', 'submission_status']);
                $table->index('submission_status');
            });
        }

        // Restore documents approval columns
        if (Schema::hasTable('documents')) {
            Schema::table('documents', function (Blueprint $table) {
                if (!Schema::hasColumn('documents', 'approval_status')) {
                    $table->string('approval_status')->default('pending')->after('status');
                }
                if (!Schema::hasColumn('documents', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('approval_status');
                }
                if (!Schema::hasColumn('documents', 'approved_by')) {
                    $table->foreignUuid('approved_by')->nullable()
                        ->constrained('users')->nullOnDelete()->after('rejection_reason');
                }
                if (!Schema::hasColumn('documents', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable()->after('approved_by');
                }
            });
        }

        // Recreate area_submissions skeleton (best-effort — no data restored)
        if (!Schema::hasTable('area_submissions')) {
            Schema::create('area_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('area_id')->constrained()->cascadeOnDelete();
                $table->foreignId('program_id')->constrained()->cascadeOnDelete();
                $table->foreignId('cycle_id')->nullable()->constrained('accreditation_cycles')->nullOnDelete();
                $table->string('status')->default('draft');
                $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('submitted_at')->nullable();
                $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('return_notes')->nullable();
                $table->timestamps();
                $table->unique(['area_id', 'program_id', 'cycle_id']);
            });
        }

        Schema::dropIfExists('revision_returns');
    }
};
