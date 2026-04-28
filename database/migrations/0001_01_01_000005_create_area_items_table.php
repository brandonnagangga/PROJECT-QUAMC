<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_area_id')->constrained()->cascadeOnDelete();
            $table->enum('ipo_type', ['input', 'process', 'outcome']);
            // null = top-level item; non-null = sub-item
            $table->foreignId('parent_item_id')->nullable()->constrained('area_items')->nullOnDelete();
            $table->string('label');          // "Item 1", "Sub-item a", "Sub-item 1.1"
            $table->smallInteger('order_number')->default(0);
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['sub_area_id', 'ipo_type', 'order_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_items');
    }
};
