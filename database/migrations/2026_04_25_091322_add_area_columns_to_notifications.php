<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('area_id')->nullable()->after('document_id');
            $table->text('link')->nullable()->after('area_id');

            $table->foreign('area_id')->references('id')->on('areas')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['area_id']);
            $table->dropColumn(['area_id', 'link']);
        });
    }
};
