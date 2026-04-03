<?php
// This migration is neutralized — area_checklists replaced by fixed doc_type enum on documents.
use Illuminate\Database\Migrations\Migration;
return new class extends Migration {
    public function up(): void {}
    public function down(): void { \Illuminate\Support\Facades\Schema::dropIfExists('area_checklists'); }
};
