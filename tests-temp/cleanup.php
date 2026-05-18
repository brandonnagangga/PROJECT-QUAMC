<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaAssignment;
use App\Models\AreaItem;
use App\Models\AreaItemResponse;
use App\Models\Document;
use App\Models\Notification;
use App\Models\Program;
use App\Models\RevisionReturn;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "Cleaning previous test artefacts.\n";

// Wipe revision_returns linked to TEST data
$testProgIds = Program::where('code', 'TST_CE')->pluck('id');
$testAreaIds = Area::where('name', 'TEST_Area_99')->pluck('id');
$testSubAreaIds = SubArea::whereIn('area_id', $testAreaIds)->pluck('id');
$testItemIds = AreaItem::whereIn('sub_area_id', $testSubAreaIds)->pluck('id');

if ($testSubAreaIds->isNotEmpty()) {
    DB::table('revision_returns')->whereIn('sub_area_id', $testSubAreaIds)->delete();
}

// Test users
$testUsers = User::where('email', 'like', 'test_%@quamc.edu')->get();
foreach ($testUsers as $u) {
    AreaAssignment::where('user_id', $u->id)->delete();
    Notification::where('user_id', $u->id)->delete();
    $u->roles()->detach();
    $u->delete();
}
echo "  Users wiped: " . $testUsers->count() . "\n";

// Documents under test areas
if ($testSubAreaIds->isNotEmpty()) {
    $docs = Document::whereIn('sub_area_id', $testSubAreaIds)->get();
    foreach ($docs as $d) {
        DB::table('document_versions')->where('document_id', $d->id)->delete();
        $d->delete();
    }
    echo "  Documents wiped: " . $docs->count() . "\n";
}

// Item responses + items + sub-areas
if ($testItemIds->isNotEmpty()) AreaItemResponse::whereIn('area_item_id', $testItemIds)->delete();
if ($testSubAreaIds->isNotEmpty()) AreaItem::whereIn('sub_area_id', $testSubAreaIds)->delete();
SubArea::whereIn('area_id', $testAreaIds)->delete();
Area::whereIn('id', $testAreaIds)->delete();

// Programs + cycles
Program::where('code', 'TST_CE')->delete();
AccreditationCycle::where('name', 'TEST_Cycle_2025-2026')->delete();

echo "Done.\n";
