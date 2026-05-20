<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('area_items')) {
            return;
        }

        Schema::create('area_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_area_id')->constrained()->cascadeOnDelete();
            $table->enum('ipo_type', ['input', 'process', 'outcome']);
            $table->foreignId('parent_item_id')->nullable()->constrained('area_items')->nullOnDelete();
            $table->text('label');
            $table->smallInteger('order_number')->default(0);
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['sub_area_id', 'ipo_type', 'order_number']);
        });
    }

    public function down(): void
    {
        // Intentionally no-op: this migration repairs drift without risking data loss on rollback.
    }
};
