<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// area_items table is REMOVED per director confirmation.
// Fixed document types (Input / Process / Outcome) are an enum column on `documents`.
return new class extends Migration
{
    public function up(): void
    {
        // Intentionally empty — area_items no longer exists
    }

    public function down(): void
    {
        Schema::dropIfExists('area_items');
    }
};
