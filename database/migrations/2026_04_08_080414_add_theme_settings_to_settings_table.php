<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert default theme settings
        DB::table('settings')->insert([
            [
                'key' => 'theme_mode',
                'value' => 'themed', // minimalist, themed, seasonal
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'theme_primary_color',
                'value' => '#185FA5', // Default blue
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'theme_secondary_color',
                'value' => '#1a7a4a', // Default green
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seasonal_theme',
                'value' => 'default', // christmas, newyear, valentine, etc.
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seasonal_theme_enabled',
                'value' => 'false',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'theme_mode',
            'theme_primary_color',
            'theme_secondary_color',
            'seasonal_theme',
            'seasonal_theme_enabled',
        ])->delete();
    }
};
