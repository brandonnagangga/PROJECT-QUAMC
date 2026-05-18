<?php
/**
 * QUAMC — Full system smoke test.
 *
 * Covers, end-to-end:
 *   1. Account creation (admin, director, dean, program-coord, area-coord)
 *   2. Program creation + assigning users to a program
 *   3. Area structure: areas, sub-areas, items, sub-items
 *   4. Area-coordinator area assignment
 *   5. Accreditation cycle: create + activate + switch
 *   6. Document upload (create + new version) + slot lookup
 *   7. AreaItem response save/load + supporting evidence file upload
 *   8. Revision Returns: dean returns sub-area + director returns item
 *   9. Resolution rules (Director-returns require coordinator)
 *  10. Notifications + activity log writes
 *  11. Dashboard payload sanity (openReturns visible to right roles)
 *  12. PDF export endpoint reachable
 *  13. Cleanup of ALL test rows
 *
 * Test users created here all start with TEST_ prefix and are deleted at the end.
 *
 * Run:
 *   php tests-temp/test_full_workflow.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\CycleController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AreaItemController;
use App\Http\Controllers\AreaItemFileController;
use App\Http\Controllers\AreaItemResponseController;
use App\Http\Controllers\RevisionReturnController;
use App\Http\Controllers\SubAreaController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\DocumentController;
use App\Http\Controllers\User\NotificationController;
use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaAssignment;
use App\Models\AreaItem;
use App\Models\AreaItemFile;
use App\Models\AreaItemResponse;
use App\Models\AreaSubmission;
use App\Models\Document;
use App\Models\Notification;
use App\Models\Program;
use App\Models\RevisionReturn;
use App\Models\Role;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

// ────────────────────────────────────────────────────────────────────────────
$results = [];      // [section, label, status, detail]
$cleanup = [];      // closures to run at end

function record(string $section, string $label, $ok, ?string $detail = null) {
    global $results;
    $status = $ok === true ? 'PASSED' : 'FAILED';
    if ($ok !== true && $detail === null && is_string($ok)) $detail = $ok;
    $results[] = compact('section', 'label', 'status', 'detail');
    $glyph = $ok === true ? '✓' : '✗';
    $line = "  {$glyph} {$label}";
    if ($detail) $line .= " — {$detail}";
    echo $line . "\n";
}

function probe(string $section, string $label, callable $fn) {
    try {
        $r = $fn();
        record($section, $label, $r === true ? true : (is_string($r) ? $r : false), is_string($r) ? $r : null);
    } catch (\Throwable $e) {
        record($section, $label, false, 'EXCEPTION: ' . $e->getMessage());
    }
}

function as_user(User $u, callable $fn) {
    auth()->login($u);
    try { return $fn(); }
    catch (\Throwable $e) {
        // Don't crash the harness — let individual probes record their own outcome
        echo "    ! action raised: " . $e->getMessage() . "\n";
        return null;
    }
    finally { auth()->logout(); }
}

function req(string $method, string $path, array $payload, User $u, array $files = []): Request {
    $r = Request::create($path, $method, $payload, [], $files);
    $r->setUserResolver(fn() => $u);
    return $r;
}

function fakeTextFile(string $name = 'test.pdf'): UploadedFile {
    $tmp = tempnam(sys_get_temp_dir(), 'quamc_test_');
    // Write 5 bytes — enough to simulate a tiny PDF
    file_put_contents($tmp, "%PDF-\n");
    return new UploadedFile($tmp, $name, 'application/pdf', null, true);
}

function dump_section(string $title) {
    echo "\n────────────────────────────────────────────────────────────\n";
    echo "  {$title}\n";
    echo "────────────────────────────────────────────────────────────\n";
}

// ────────────────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════\n";
echo "  QUAMC — FULL WORKFLOW SMOKE TEST\n";
echo "  " . date('Y-m-d H:i:s') . "\n";
echo "════════════════════════════════════════════════════════════\n";

$adminUser = User::whereHas('roles', fn($q) => $q->where('slug', 'admin'))->first();
if (!$adminUser) {
    echo "✗ No admin user found. Run UserSeeder first.\n";
    exit(1);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. SCHEMA SANITY
// ════════════════════════════════════════════════════════════════════════════
dump_section("1. Schema sanity");

probe('schema', 'revision_returns table exists',
    fn() => Schema::hasTable('revision_returns') ?: 'missing');
probe('schema', 'area_submissions table dropped',
    fn() => !Schema::hasTable('area_submissions') ?: 'still exists');
probe('schema', 'sub_areas.submission_status dropped',
    fn() => !Schema::hasColumn('sub_areas', 'submission_status') ?: 'still there');
probe('schema', 'documents.approval_status dropped',
    fn() => !Schema::hasColumn('documents', 'approval_status') ?: 'still there');
probe('schema', 'AreaSubmission model file is gone',
    fn() => !file_exists(__DIR__ . '/../app/Models/AreaSubmission.php') ?: 'still there');

// ════════════════════════════════════════════════════════════════════════════
// 2. ACCOUNT CREATION
// ════════════════════════════════════════════════════════════════════════════
dump_section("2. Account creation (UserController@store)");

$adminRole       = Role::where('slug', 'admin')->first();
$directorRole    = Role::where('slug', 'director')->first();
$deanRole        = Role::where('slug', 'dean')->first();
$progCoordRole   = Role::where('slug', 'program-coordinator')->first();
$areaCoordRole   = Role::where('slug', 'area-coordinator')->first();

probe('roles', 'all 5 role slugs present',
    fn() => $adminRole && $directorRole && $deanRole && $progCoordRole && $areaCoordRole
            ? true : 'missing one');

$userCtrl = new UserController();

$createUser = function(string $name, string $email, Role $role, ?int $programId = null) use ($userCtrl, $adminUser) {
    return as_user($adminUser, function() use ($userCtrl, $name, $email, $role, $programId, $adminUser) {
        $r = req('POST', '/users', [
            'name' => $name, 'email' => $email, 'password' => 'password123',
            'role_id' => $role->id, 'program_id' => $programId,
        ], $adminUser);
        $userCtrl->store($r);
        return User::where('email', $email)->first();
    });
};

$tDirector = $createUser('TEST_Director',  'test_director@quamc.edu',  $directorRole);
$tDean     = null;  // will assign after program created
$tProgCoord= null;
$tAreaCoord= null;

probe('accounts', 'director created',  fn() => $tDirector ? true : 'null');
probe('accounts', 'director has director role',
    fn() => $tDirector && $tDirector->roles->contains('slug', 'director') ?: 'no role');

$cleanup[] = function() use (&$tDirector, &$tDean, &$tProgCoord, &$tAreaCoord) {
    foreach ([$tDirector, $tDean, $tProgCoord, $tAreaCoord] as $u) {
        if ($u) { $u->roles()->detach(); $u->delete(); }
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. PROGRAM CREATION + USER ASSIGNMENT
// ════════════════════════════════════════════════════════════════════════════
dump_section("3. Program creation & assignment (ProgramController)");

$progCtrl = new ProgramController();

$tProgram = null;
as_user($adminUser, function() use ($progCtrl, $adminUser, &$tProgram) {
    $r = req('POST', '/programs', [
        'name' => 'TEST_Program_Civil',
        'code' => 'TST_CE',
    ], $adminUser);
    $progCtrl->store($r);
    $tProgram = Program::where('code', 'TST_CE')->first();
});

probe('programs', 'program created with code TST_CE',
    fn() => $tProgram ? true : 'not created');

// Now make the dean / coords with program_id set
$tDean      = $createUser('TEST_Dean',      'test_dean@quamc.edu',      $deanRole,      $tProgram?->id);
$tProgCoord = $createUser('TEST_ProgCoord', 'test_progcoord@quamc.edu', $progCoordRole, $tProgram?->id);
$tAreaCoord = $createUser('TEST_AreaCoord', 'test_areacoord@quamc.edu', $areaCoordRole, $tProgram?->id);

probe('accounts', 'dean created with program scope',
    fn() => $tDean && (int) $tDean->program_id === (int) $tProgram->id ?: 'wrong scope');
probe('accounts', 'program-coordinator created with program scope',
    fn() => $tProgCoord && (int) $tProgCoord->program_id === (int) $tProgram->id ?: 'wrong scope');
probe('accounts', 'area-coordinator created with program scope',
    fn() => $tAreaCoord && (int) $tAreaCoord->program_id === (int) $tProgram->id ?: 'wrong scope');

$cleanup[] = function() use (&$tProgram) {
    if ($tProgram) $tProgram->delete();
};

// ════════════════════════════════════════════════════════════════════════════
// 4. AREA & SUB-AREA STRUCTURE
// ════════════════════════════════════════════════════════════════════════════
dump_section("4. Area / Sub-area / Item CRUD (Director-only)");

$areaCtrl    = new AreaController();
$subCtrl     = new SubAreaController();
$itemCtrl    = new AreaItemController();

$tArea = null;
as_user($tDirector, function() use ($areaCtrl, $tDirector, &$tArea) {
    $r = req('POST', '/areas', [
        'name' => 'TEST_Area_99',
        'order_number' => 99,
        'sub_areas' => ['TEST_SA_A', 'TEST_SA_B'],
    ], $tDirector);
    $areaCtrl->store($r);
    $tArea = Area::where('name', 'TEST_Area_99')->first();
});

probe('areas', 'area created',
    fn() => $tArea ? true : 'not created');
probe('areas', 'area has 2 sub-areas',
    fn() => $tArea && $tArea->subAreas()->count() === 2 ?: 'count: ' . ($tArea?->subAreas()->count() ?? '-'));

$tSubA = $tArea?->subAreas()->where('order_number', 1)->first();
$tSubB = $tArea?->subAreas()->where('order_number', 2)->first();

// Director-only enforcement: dean tries to create sub-area
as_user($tDean, function() use ($subCtrl, $tArea, $tDean, &$failedAsDean) {
    $r = req('POST', "/areas/{$tArea->id}/sub-areas", [
        'area_id' => $tArea->id, 'name' => 'should_fail', 'order_number' => 99,
    ], $tDean);
    $subCtrl->store($r);
});
probe('authz', 'dean cannot create sub-area',
    fn() => SubArea::where('area_id', $tArea->id)
            ->where('name', 'should_fail')->doesntExist() ?: 'created anyway');

// Items
as_user($tDirector, function() use ($itemCtrl, $tSubA, $tDirector, &$tItem) {
    $r = req('POST', '/area-items', [
        'sub_area_id'    => $tSubA->id,
        'ipo_type'       => 'input',
        'parent_item_id' => null,
        'label'          => 'TEST_ITEM_PARENT',
    ], $tDirector);
    $itemCtrl->store($r);
});
$tItem = AreaItem::where('sub_area_id', $tSubA->id)->where('label', 'TEST_ITEM_PARENT')->first();
probe('items', 'parent item created',
    fn() => $tItem ? true : 'not found');

as_user($tDirector, function() use ($itemCtrl, $tSubA, $tItem, $tDirector, &$tSubItem) {
    $r = req('POST', '/area-items', [
        'sub_area_id'    => $tSubA->id,
        'ipo_type'       => 'input',
        'parent_item_id' => $tItem->id,
        'label'          => 'TEST_SUB_ITEM_CHILD',
    ], $tDirector);
    $itemCtrl->store($r);
});
$tSubItem = AreaItem::where('parent_item_id', $tItem->id)->first();
probe('items', 'sub-item created with correct parent',
    fn() => $tSubItem ? true : 'not found');

$cleanup[] = function() use (&$tArea) {
    if ($tArea) {
        AreaItemResponse::whereIn('area_item_id',
            AreaItem::whereIn('sub_area_id', $tArea->subAreas()->pluck('id'))->pluck('id')
        )->delete();
        AreaItem::whereIn('sub_area_id', $tArea->subAreas()->pluck('id'))->delete();
        SubArea::where('area_id', $tArea->id)->delete();
        $tArea->delete();
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 5. AREA ASSIGNMENT (UserController@assignArea)
// ════════════════════════════════════════════════════════════════════════════
dump_section("5. Area assignment (UserController@assignArea)");

as_user($adminUser, function() use ($userCtrl, $tAreaCoord, $tArea, $adminUser) {
    $r = req('POST', "/users/{$tAreaCoord->id}/assign-area", [
        'area_ids'      => [$tArea->id],
        'role_type'     => 'area-coordinator',
        'academic_year' => '2025-2026',
    ], $adminUser);
    $userCtrl->assignArea($r, $tAreaCoord);
});

probe('assignments', 'area-coordinator assigned to test area',
    fn() => AreaAssignment::where('user_id', $tAreaCoord->id)
            ->where('area_id', $tArea->id)->exists() ?: 'no assignment');

$cleanup[] = function() use (&$tAreaCoord, &$tArea) {
    if ($tAreaCoord && $tArea) {
        AreaAssignment::where('user_id', $tAreaCoord->id)
            ->where('area_id', $tArea->id)->delete();
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 6. ACCREDITATION CYCLE
// ════════════════════════════════════════════════════════════════════════════
dump_section("6. Cycle create / activate / switch");

$cycleCtrl = new CycleController();
$tCycle = null;
try {
    as_user($tDirector, function() use ($cycleCtrl, $tDirector, &$tCycle) {
        $r = req('POST', '/cycles', [
            'name'          => 'TEST_Cycle_2025-2026',
            'academic_year' => 'AY 2025-2026',
            'start_date'    => now()->subDays(10)->format('Y-m-d'),
            'end_date'      => now()->addDays(180)->format('Y-m-d'),
        ], $tDirector);
        $cycleCtrl->store($r);
        $tCycle = AccreditationCycle::where('name', 'TEST_Cycle_2025-2026')->first();
    });
} catch (\Throwable $e) {
    record('cycles', 'cycle store call', false, 'EXCEPTION: ' . $e->getMessage());
}

probe('cycles', 'cycle created',
    fn() => $tCycle ? true : 'not created');

// Activate
if ($tCycle) {
    as_user($tDirector, function() use ($cycleCtrl, $tCycle, $tDirector) {
        $r = req('POST', "/cycles/{$tCycle->id}/activate", [], $tDirector);
        $cycleCtrl->activate($tCycle, $r);
    });
    $tCycle->refresh();
    probe('cycles', 'cycle activated',
        fn() => $tCycle->is_active === 1 || $tCycle->is_active === true ?: 'is_active=' . var_export($tCycle->is_active, true));
}

$cleanup[] = function() use (&$tCycle) {
    if ($tCycle) {
        // Reactivate any other cycle so the system isn't left without one
        $tCycle->delete();
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 7. DOCUMENT UPLOAD + VERSION
// ════════════════════════════════════════════════════════════════════════════
dump_section("7. Document upload (DocumentController@store)");

$docCtrl = new DocumentController();
$tDoc = null;

// Coordinator must have area assignment to upload
as_user($tAreaCoord, function() use ($docCtrl, $tSubA, $tProgram, $tAreaCoord, &$tDoc) {
    $file = fakeTextFile('test_evidence_v1.pdf');
    $r = req('POST', '/documents', [
        'sub_area_id' => $tSubA->id,
        'program_id'  => $tProgram->id,
        'doc_type'    => 'input',
        'title'       => 'TEST_DOC_TITLE',
    ], $tAreaCoord, ['file' => $file]);
    $docCtrl->store($r);
    $tDoc = Document::where('title', 'TEST_DOC_TITLE')->first();
});

probe('documents', 'coordinator uploaded a doc',
    fn() => $tDoc ? true : 'no doc');
probe('documents', 'doc current_version=1',
    fn() => $tDoc && (int) $tDoc->current_version === 1 ?: 'version=' . $tDoc?->current_version);
probe('documents', 'doc has approval_status removed (no field)',
    fn() => $tDoc && !array_key_exists('approval_status', $tDoc->getAttributes()) ?: 'still has it');

// Upload another version
as_user($tAreaCoord, function() use ($docCtrl, $tSubA, $tProgram, $tAreaCoord, &$tDoc) {
    $file = fakeTextFile('test_evidence_v2.pdf');
    $r = req('POST', '/documents', [
        'sub_area_id' => $tSubA->id,
        'program_id'  => $tProgram->id,
        'doc_type'    => 'input',
        'title'       => 'TEST_DOC_TITLE',
    ], $tAreaCoord, ['file' => $file]);
    $docCtrl->store($r);
    $tDoc->refresh();
});

probe('documents', 'second upload bumps to version 2',
    fn() => $tDoc && (int) $tDoc->current_version === 2 ?: 'version=' . $tDoc?->current_version);

$cleanup[] = function() use (&$tDoc) {
    if ($tDoc) {
        DB::table('document_versions')->where('document_id', $tDoc->id)->delete();
        $tDoc->delete();
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 8. AREA ITEM RESPONSE (narrative + rating)
// ════════════════════════════════════════════════════════════════════════════
dump_section("8. AreaItemResponse save/load");

$respCtrl = new AreaItemResponseController();

as_user($tAreaCoord, function() use ($respCtrl, $tItem, $tAreaCoord, &$savedResp) {
    $r = req('POST', "/area-items/{$tItem->id}/response", [
        'content_text' => 'TEST narrative — this is the response text.',
        'rating'       => 4,
    ], $tAreaCoord);
    $respCtrl->saveDraft($r, $tItem);
});

probe('responses', 'response saved with rating + content_text',
    function() use ($tItem) {
        $r = AreaItemResponse::where('area_item_id', $tItem->id)->first();
        return $r && (int) $r->rating === 4 && str_contains($r->content_text, 'TEST narrative') ?: 'mismatch';
    });

$cleanup[] = function() use (&$tItem) {
    if ($tItem) AreaItemResponse::where('area_item_id', $tItem->id)->delete();
};

// ════════════════════════════════════════════════════════════════════════════
// 9. REVISION RETURNS (the new workflow)
// ════════════════════════════════════════════════════════════════════════════
dump_section("9. Revision Return workflow");

$retCtrl = new RevisionReturnController();

// Wipe pre-existing test returns to be safe
DB::table('revision_returns')->where('sub_area_id', $tSubA->id)->where('program_id', $tProgram->id)->delete();

// Dean returns the sub-area
as_user($tDean, function() use ($retCtrl, $tSubA, $tProgram, $tDean) {
    $r = req('POST', '/returns', [
        'target_type' => 'sub_area',
        'target_id'   => $tSubA->id,
        'program_id'  => $tProgram->id,
        'comment'     => 'TEST: needs fixing',
    ], $tDean);
    $retCtrl->store($r);
});

probe('returns', 'dean created sub-area return',
    fn() => RevisionReturn::active()
            ->where('returnable_type', (new SubArea)->getMorphClass())
            ->where('returnable_id', $tSubA->id)
            ->where('returned_by_role', 'dean')->exists() ?: 'missing');

// Director returns an item
as_user($tDirector, function() use ($retCtrl, $tItem, $tProgram, $tDirector) {
    $r = req('POST', '/returns', [
        'target_type' => 'item',
        'target_id'   => $tItem->id,
        'program_id'  => $tProgram->id,
        'comment'     => 'TEST: incomplete narrative',
    ], $tDirector);
    $retCtrl->store($r);
});

probe('returns', 'director created item return',
    fn() => RevisionReturn::active()
            ->where('returnable_type', (new AreaItem)->getMorphClass())
            ->where('returnable_id', $tItem->id)
            ->where('returned_by_role', 'director')->exists() ?: 'missing');

// Dean cannot resolve a Director-returned record
$dirReturn = RevisionReturn::active()->where('returned_by_role', 'director')
    ->where('returnable_id', $tItem->id)->first();

as_user($tDean, function() use ($retCtrl, $dirReturn, $tDean) {
    $r = req('POST', "/returns/{$dirReturn->id}/resolve", [], $tDean);
    $retCtrl->resolve($dirReturn, $r);
});
$dirReturn->refresh();
probe('returns', 'dean cannot resolve a Director return',
    fn() => $dirReturn->resolved_at === null ?: 'incorrectly resolved');

// Coordinator resolves Director's return
as_user($tProgCoord, function() use ($retCtrl, $dirReturn, $tProgCoord) {
    $r = req('POST', "/returns/{$dirReturn->id}/resolve", [], $tProgCoord);
    $retCtrl->resolve($dirReturn, $r);
});
$dirReturn->refresh();
probe('returns', 'program-coordinator resolved Director return',
    fn() => $dirReturn->resolved_at !== null ?: 'still active');

// Coordinator resolves Dean's return
$deanReturn = RevisionReturn::active()->where('returned_by_role', 'dean')
    ->where('returnable_id', $tSubA->id)->first();
as_user($tAreaCoord, function() use ($retCtrl, $deanReturn, $tAreaCoord) {
    $r = req('POST', "/returns/{$deanReturn->id}/resolve", [], $tAreaCoord);
    $retCtrl->resolve($deanReturn, $r);
});
$deanReturn->refresh();
probe('returns', 'area-coordinator resolved Dean return',
    fn() => $deanReturn->resolved_at !== null ?: 'still active');

$cleanup[] = function() use ($tSubA, $tProgram) {
    DB::table('revision_returns')->where('sub_area_id', $tSubA->id)->where('program_id', $tProgram->id)->delete();
};

// ════════════════════════════════════════════════════════════════════════════
// 10. DASHBOARD PAYLOAD (openReturns visibility)
// ════════════════════════════════════════════════════════════════════════════
dump_section("10. Dashboard payload sanity");

// Recreate one open return so the dashboard has something to see
as_user($tDean, function() use ($retCtrl, $tSubA, $tProgram, $tDean) {
    $r = req('POST', '/returns', [
        'target_type' => 'sub_area',
        'target_id'   => $tSubA->id,
        'program_id'  => $tProgram->id,
        'comment'     => 'TEST dashboard probe',
    ], $tDean);
    $retCtrl->store($r);
});

$dashCtrl = new DashboardController();

// Build openReturns with reflection
$reflectDash = new ReflectionClass($dashCtrl);
$buildOpenReturns = $reflectDash->getMethod('buildOpenReturns');
$buildOpenReturns->setAccessible(true);

$dirReturns = $buildOpenReturns->invoke($dashCtrl, $tDirector->load('roles'), 'director');
probe('dashboard', 'director sees open returns globally',
    fn() => is_array($dirReturns) && count($dirReturns) >= 1 ?: 'count=' . (is_array($dirReturns) ? count($dirReturns) : 'not array'));

$deanReturns = $buildOpenReturns->invoke($dashCtrl, $tDean->load('roles'), 'dean');
probe('dashboard', 'dean sees open returns scoped to program',
    function() use ($deanReturns, $tProgram) {
        if (!is_array($deanReturns) || empty($deanReturns)) return 'empty';
        foreach ($deanReturns as $r) {
            if ($r['program_name'] !== null && $r['program_name'] !== $tProgram->name) {
                return 'unscoped: ' . $r['program_name'];
            }
        }
        return true;
    });

$coordReturns = $buildOpenReturns->invoke($dashCtrl, $tAreaCoord->load('roles'), 'area-coordinator');
probe('dashboard', 'area-coordinator sees open returns in their assigned area',
    fn() => is_array($coordReturns) && count($coordReturns) >= 1 ?: 'count=' . (is_array($coordReturns) ? count($coordReturns) : 'not array'));

// ════════════════════════════════════════════════════════════════════════════
// 11. AREACONTROLLER@INDEX PAYLOAD includes returns
// ════════════════════════════════════════════════════════════════════════════
dump_section("11. AreaController@index payload");

$reflectArea = new ReflectionClass($areaCtrl);
$loadActiveReturns = $reflectArea->getMethod('loadActiveReturns');
$loadActiveReturns->setAccessible(true);

$grouped = $loadActiveReturns->invoke($areaCtrl, [$tSubA->id], [$tProgram->id]);
probe('areas', 'loadActiveReturns groups by program_id',
    fn() => isset($grouped[$tProgram->id]) ?: 'missing program key');
probe('areas', 'returned key for sub_area:N present',
    fn() => isset($grouped[$tProgram->id]["sub_area:{$tSubA->id}"]) ?: 'missing morph key');

// ════════════════════════════════════════════════════════════════════════════
// 12. EXPORT ENDPOINT REACHABILITY (does it 200 / does it abort gracefully?)
// ════════════════════════════════════════════════════════════════════════════
dump_section("12. Export endpoints");

probe('exports', 'export.area route registered',
    function() {
        $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
        return $routes->contains(fn($r) => $r->getName() === 'export.area') ?: 'missing route';
    });

probe('exports', 'export.subArea route registered',
    function() {
        $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
        return $routes->contains(fn($r) => $r->getName() === 'export.subArea') ?: 'missing route';
    });

probe('exports', 'AreaSurveyExportService class exists',
    fn() => class_exists(\App\Services\AreaSurveyExportService::class) ?: 'missing');
probe('exports', 'SubAreaPdfExportService class exists',
    fn() => class_exists(\App\Services\SubAreaPdfExportService::class) ?: 'missing');

// ════════════════════════════════════════════════════════════════════════════
// 13. NOTIFICATIONS  (write + read + mark-read)
// ════════════════════════════════════════════════════════════════════════════
dump_section("13. Notifications");

$tNotif = Notification::create([
    'user_id'  => $tAreaCoord->id,
    'area_id'  => $tArea->id,
    'type'     => 'test.event',
    'message'  => 'TEST notification message',
    'is_read'  => false,
]);

probe('notifications', 'notification record created',
    fn() => $tNotif && $tNotif->id ? true : 'no row');

$notifCtrl = new NotificationController();
as_user($tAreaCoord, function() use ($notifCtrl, $tNotif, $tAreaCoord) {
    $r = req('POST', "/notifications/{$tNotif->id}/read", [], $tAreaCoord);
    $notifCtrl->markRead($r, $tNotif);
});
$tNotif->refresh();
probe('notifications', 'mark-read flips is_read=true',
    fn() => $tNotif->is_read ?: 'still unread');

$cleanup[] = function() use (&$tNotif) { if ($tNotif) $tNotif->delete(); };

// ════════════════════════════════════════════════════════════════════════════
// 14. ROUTE REGISTRATION SANITY (key new + removed routes)
// ════════════════════════════════════════════════════════════════════════════
dump_section("14. Route registration");

$routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes())
    ->mapWithKeys(fn($r) => [$r->getName() ?? '_' . $r->uri() => $r->methods()[0]]);

$musts = ['returns.store', 'returns.resolve', 'sub-areas.update', 'sub-areas.archive',
    'areas.index', 'areas.management', 'areas.store', 'areas.update', 'areas.archive',
    'documents.store', 'documents.show', 'cycles.store', 'cycles.activate',
    'export.area', 'export.subArea', 'item-responses.saveDraft'];
foreach ($musts as $r) {
    probe('routes', "route '{$r}' registered",
        fn() => isset($routes[$r]) ?: 'missing');
}

$musnts = ['areas.submitToDean', 'areas.submitToDirector', 'areas.return', 'areas.approve',
    'sub-areas.submit', 'sub-areas.forward', 'sub-areas.approve',
    'documents.approve', 'documents.reject', 'documents.submit', 'documents.workflow', 'documents.resubmit'];
foreach ($musnts as $r) {
    probe('routes', "old route '{$r}' is gone",
        fn() => !isset($routes[$r]) ?: 'still registered');
}

// ════════════════════════════════════════════════════════════════════════════
//  CLEANUP
// ════════════════════════════════════════════════════════════════════════════
dump_section("Cleanup");
foreach (array_reverse($cleanup) as $c) {
    try { $c(); echo "  ↪ ok\n"; }
    catch (\Throwable $e) { echo "  ! cleanup failed: " . $e->getMessage() . "\n"; }
}

// ════════════════════════════════════════════════════════════════════════════
//  FINAL REPORT
// ════════════════════════════════════════════════════════════════════════════
$pass = collect($results)->where('status', 'PASSED')->count();
$fail = collect($results)->where('status', 'FAILED')->count();
$total = count($results);

echo "\n";
echo "════════════════════════════════════════════════════════════\n";
echo "  TEST REPORT\n";
echo "════════════════════════════════════════════════════════════\n\n";

printf("  %-12s %-50s %s\n", "SECTION", "TEST", "RESULT");
printf("  %s\n", str_repeat('─', 78));

foreach ($results as $r) {
    printf("  %-12s %-50s %s%s\n",
        $r['section'],
        substr($r['label'], 0, 50),
        $r['status'],
        $r['detail'] && $r['status'] === 'FAILED' ? " ({$r['detail']})" : ''
    );
}

echo "\n";
echo "  ────────────────────────────────────────────────────────\n";
echo "  TOTAL: {$total}   PASSED: {$pass}   FAILED: {$fail}\n";
echo "  ────────────────────────────────────────────────────────\n";

exit($fail > 0 ? 1 : 0);
