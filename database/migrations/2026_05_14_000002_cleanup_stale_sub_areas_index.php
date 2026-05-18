<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cleanup migration:
 *
 * After dropping `sub_areas.submission_status` in the previous migration, the old
 * composite index `sub_areas_area_id_submission_status_index` collapsed to just
 * `(area_id)`. It works correctly but the name is misleading.
 *
 * MySQL won't let us drop it directly because it's currently the only index
 * supporting the area_id foreign key. So we:
 *   1. Create a new clean index `sub_areas_area_id_index` on (area_id)
 *   2. Drop the stale composite index by name
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sub_areas')) return;

        $indexes = collect(DB::select("SHOW INDEX FROM sub_areas"))->pluck('Key_name')->unique()->all();

        // 1. Create a fresh `sub_areas_area_id_index` if it doesn't exist
        if (!in_array('sub_areas_area_id_index', $indexes, true)) {
            Schema::table('sub_areas', function (Blueprint $table) {
                $table->index('area_id', 'sub_areas_area_id_index');
            });
        }

        // 2. Now safely drop the stale composite name
        if (in_array('sub_areas_area_id_submission_status_index', $indexes, true)) {
            Schema::table('sub_areas', function (Blueprint $table) {
                $table->dropIndex('sub_areas_area_id_submission_status_index');
            });
        }
    }

    public function down(): void
    {
        // Cosmetic-only migration — no point reversing.
    }
};
