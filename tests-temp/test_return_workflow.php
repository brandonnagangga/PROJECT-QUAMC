<?php

/**
 * Manual integration test for the new Return Workflow.
 *
 * Run with:
 *   php artisan tinker tests-temp/test_return_workflow.php
 *
 * Or via composer/laravel test runner if you prefer (this is a quick smoke test).
 *
 * Tests covered:
 *   1.  Schema sanity (revision_returns exists, area_submissions gone, etc.)
 *   2.  Dean creates a sub-area return → expect 1 active row, role='dean'
 *   3.  Director creates an item return on the same sub-area → expect 2 active
 *   4.  Dean tries to return outside their program → expect rejection
 *   5.  Coordinator (any) marks the Dean-returned record as resolved → ok
 *   6.  Coordinator marks Director-returned item as resolved → ok (allowed)
 *   7.  Dean tries to resolve a Director-returned record → expect rejection
 *   8.  Duplicate return on same target+program → comment is appended, NOT a new row
 *   9.  Verify counts via AreaController@index payload-style queries
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\RevisionReturnController;
use App\Models\AreaItem;
use App\Models\Program;
use App\Models\RevisionReturn;
use App\Models\SubArea;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$pass = 0; $fail = 0; $skip = 0;
$assertions = [];

function check(string $label, callable $fn) {
    global $pass, $fail, $assertions;
    try {
        $result = $fn();
        if ($result === true) {
            $pass++;
            echo "  ✓ {$label}\n";
            $assertions[] = ['ok', $label, null];
        } else {
            $fail++;
            echo "  ✗ {$label}  →  " . (is_string($result) ? $result : 'returned ' . var_export($result, true)) . "\n";
            $assertions[] = ['fail', $label, $result];
        }
    } catch (\Throwable $e) {
        $fail++;
        echo "  ✗ {$label}  →  EXCEPTION: " . $e->getMessage() . "\n";
        $assertions[] = ['exception', $label, $e->getMessage()];
    }
}

echo "════════════════════════════════════════════════════════════════════════\n";
echo "  RETURN WORKFLOW — INTEGRATION TEST\n";
echo "════════════════════════════════════════════════════════════════════════\n\n";

// ── 1. Schema sanity ──────────────────────────────────────────────────────
echo "1. Schema sanity\n";
check("revision_returns table exists",
    fn() => Schema::hasTable('revision_returns') ?: 'missing'
);
check("area_submissions table is gone",
    fn() => !Schema::hasTable('area_submissions') ?: 'still exists'
);
check("sub_areas.submission_status is gone",
    fn() => !Schema::hasColumn('sub_areas', 'submission_status') ?: 'still there'
);
check("documents.approval_status is gone",
    fn() => !Schema::hasColumn('documents', 'approval_status') ?: 'still there'
);
check("revision_returns has expected columns",
    function() {
        $cols = ['returnable_type','returnable_id','sub_area_id','program_id','cycle_id',
                 'returned_by','returned_by_role','comment','resolved_at','resolved_by'];
        foreach ($cols as $c) {
            if (!Schema::hasColumn('revision_returns', $c)) return "missing: {$c}";
        }
        return true;
    }
);

echo "\n";

// ── 2. Setup: find users + a sub-area + an item ────────────────────────────
echo "2. Setup\n";

$dean        = User::where('email', 'gabriel@quamc.edu')->first();
$director    = User::where('email', 'director@quamc.edu')->first();
$progCoord   = User::where('email', 'janjames@quamc.edu')->first();
$areaCoord   = User::where('email', 'jsantos@quamc.edu')->first();

if (!$dean || !$director || !$progCoord || !$areaCoord) {
    echo "  ✗ Required seeded users not found. Run UserSeeder first.\n";
    exit(1);
}

$dean->load('roles');
$director->load('roles');
$progCoord->load('roles');

echo "  ↪ Dean       : {$dean->name} (program_id={$dean->program_id})\n";
echo "  ↪ Director   : {$director->name} (program_id=" . ($director->program_id ?? 'global') . ")\n";
echo "  ↪ ProgCoord  : {$progCoord->name} (program_id={$progCoord->program_id})\n";
echo "  ↪ AreaCoord  : {$areaCoord->name} (program_id={$areaCoord->program_id})\n";

$program = Program::find($dean->program_id);
if (!$program) { echo "  ✗ Dean has no program.\n"; exit(1); }
echo "  ↪ Program    : {$program->name} (id={$program->id})\n";

$subArea = SubArea::with('items')
    ->whereHas('area', fn($q) => $q->where('is_archived', false))
    ->where('is_archived', false)
    ->first();

if (!$subArea) { echo "  ✗ No sub-area found. Run AreaSeeder first.\n"; exit(1); }
echo "  ↪ SubArea    : {$subArea->name} (id={$subArea->id})\n";

$item = $subArea->items->first();
if (!$item) { echo "  ✗ Sub-area has no items.\n"; exit(1); }
echo "  ↪ Item       : " . substr($item->label, 0, 60) . "... (id={$item->id})\n";

// ── 3. Wipe any pre-existing returns on this scope so the test is deterministic ─
DB::table('revision_returns')
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->delete();
echo "  ↪ Wiped existing returns for this scope (clean slate)\n\n";

// helper: fake-authenticate as a user, run controller action, return Response/Redirect
function actAs(User $u, callable $callable) {
    auth()->login($u);
    try {
        return $callable();
    } finally {
        auth()->logout();
    }
}

function makeRequest(array $payload, User $u): Request {
    $req = Request::create('/returns', 'POST', $payload);
    $req->setUserResolver(fn() => $u);
    return $req;
}

$controller = new RevisionReturnController();

// ── 4. Dean returns the sub-area ──────────────────────────────────────────
echo "3. Dean creates a sub-area return\n";

actAs($dean, function() use ($controller, $subArea, $program, $dean) {
    $req = makeRequest([
        'target_type' => 'sub_area',
        'target_id'   => $subArea->id,
        'program_id'  => $program->id,
        'comment'     => 'Please add the missing organizational chart.',
    ], $dean);
    $controller->store($req);
});

check("1 active return now exists for sub-area + program",
    fn() => RevisionReturn::active()
            ->where('returnable_type', (new SubArea)->getMorphClass())
            ->where('returnable_id', $subArea->id)
            ->where('program_id', $program->id)
            ->count() === 1 ?: 'wrong count'
);

check("the return has role=dean",
    fn() => RevisionReturn::active()
            ->where('returnable_type', (new SubArea)->getMorphClass())
            ->where('returnable_id', $subArea->id)
            ->where('program_id', $program->id)
            ->value('returned_by_role') === 'dean' ?: 'wrong role'
);

echo "\n";

// ── 5. Director returns an item on same sub-area ──────────────────────────
echo "4. Director creates an item return\n";

actAs($director, function() use ($controller, $item, $program, $director) {
    $req = makeRequest([
        'target_type' => 'item',
        'target_id'   => $item->id,
        'program_id'  => $program->id,
        'comment'     => 'Item narrative is incomplete.',
    ], $director);
    $controller->store($req);
});

check("now 2 active returns total for this sub-area scope",
    fn() => RevisionReturn::active()
            ->where('sub_area_id', $subArea->id)
            ->where('program_id', $program->id)
            ->count() === 2 ?: 'expected 2, got ' . RevisionReturn::active()
                                ->where('sub_area_id', $subArea->id)
                                ->where('program_id', $program->id)
                                ->count()
);

check("director's return targets the correct AreaItem",
    fn() => RevisionReturn::active()
            ->where('returnable_type', (new AreaItem)->getMorphClass())
            ->where('returnable_id', $item->id)
            ->where('program_id', $program->id)
            ->where('returned_by_role', 'director')
            ->exists() ?: 'not found'
);

echo "\n";

// ── 6. Dean tries to return outside their program ─────────────────────────
echo "5. Dean attempts cross-program return (should be rejected)\n";

$otherProgram = Program::where('id', '!=', $program->id)->first();
if ($otherProgram) {
    actAs($dean, function() use ($controller, $subArea, $otherProgram, $dean) {
        $req = makeRequest([
            'target_type' => 'sub_area',
            'target_id'   => $subArea->id,
            'program_id'  => $otherProgram->id,
            'comment'     => 'unauthorized cross-program attempt',
        ], $dean);
        $response = $controller->store($req);
        // Inspect flash bag for the error
        $errorMsg = session()->get('error');
        if ($errorMsg && str_contains($errorMsg, 'within their own program')) {
            // expected
        }
    });

    check("no return record was created for the other program",
        fn() => RevisionReturn::active()
                ->where('sub_area_id', $subArea->id)
                ->where('program_id', $otherProgram->id)
                ->doesntExist() ?: 'unexpected record exists'
    );
} else {
    echo "  ⊘ skipped — only one program exists in DB\n";
    $skip++;
}

echo "\n";

// ── 7. Resolve Dean-returned record ───────────────────────────────────────
echo "6. Coordinator resolves Dean-returned record\n";

$deanReturn = RevisionReturn::active()
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->where('returned_by_role', 'dean')
    ->first();

actAs($progCoord, function() use ($controller, $deanReturn, $progCoord) {
    $req = Request::create('/returns/' . $deanReturn->id . '/resolve', 'POST');
    $req->setUserResolver(fn() => $progCoord);
    $controller->resolve($deanReturn, $req);
});

$deanReturn->refresh();
check("Dean-returned record now has resolved_at set",
    fn() => $deanReturn->resolved_at !== null ?: 'not resolved'
);

check("resolver_id matches the program coordinator",
    fn() => (string) $deanReturn->resolved_by === (string) $progCoord->id ?: 'wrong resolver'
);

echo "\n";

// ── 8. Dean tries to resolve Director-returned record ─────────────────────
echo "7. Dean attempts to resolve a Director-returned record (should be rejected)\n";

$directorReturn = RevisionReturn::active()
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->where('returned_by_role', 'director')
    ->first();

actAs($dean, function() use ($controller, $directorReturn, $dean) {
    $req = Request::create('/returns/' . $directorReturn->id . '/resolve', 'POST');
    $req->setUserResolver(fn() => $dean);
    $controller->resolve($directorReturn, $req);
});

$directorReturn->refresh();
check("Director-returned record still active after Dean attempt",
    fn() => $directorReturn->resolved_at === null ?: 'incorrectly resolved'
);

echo "\n";

// ── 9. Coordinator resolves Director-returned record ──────────────────────
echo "8. Coordinator resolves Director-returned record\n";

actAs($progCoord, function() use ($controller, $directorReturn, $progCoord) {
    $req = Request::create('/returns/' . $directorReturn->id . '/resolve', 'POST');
    $req->setUserResolver(fn() => $progCoord);
    $controller->resolve($directorReturn, $req);
});

$directorReturn->refresh();
check("Director-returned record is now resolved",
    fn() => $directorReturn->resolved_at !== null ?: 'still active'
);

echo "\n";

// ── 10. Duplicate return appends comment ──────────────────────────────────
echo "9. Duplicate return on same target+program appends comment\n";

// First create a fresh return
actAs($dean, function() use ($controller, $subArea, $program, $dean) {
    $req = makeRequest([
        'target_type' => 'sub_area',
        'target_id'   => $subArea->id,
        'program_id'  => $program->id,
        'comment'     => 'first comment',
    ], $dean);
    $controller->store($req);
});

$beforeCount = RevisionReturn::active()
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->where('returnable_type', (new SubArea)->getMorphClass())
    ->where('returnable_id', $subArea->id)
    ->count();

// Now hit it again — should APPEND not duplicate
actAs($director, function() use ($controller, $subArea, $program, $director) {
    $req = makeRequest([
        'target_type' => 'sub_area',
        'target_id'   => $subArea->id,
        'program_id'  => $program->id,
        'comment'     => 'second comment',
    ], $director);
    $controller->store($req);
});

$afterCount = RevisionReturn::active()
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->where('returnable_type', (new SubArea)->getMorphClass())
    ->where('returnable_id', $subArea->id)
    ->count();

check("duplicate return did NOT create a 2nd row (still {$beforeCount})",
    fn() => $afterCount === $beforeCount ?: "before={$beforeCount}, after={$afterCount}"
);

$mergedReturn = RevisionReturn::active()
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->where('returnable_type', (new SubArea)->getMorphClass())
    ->where('returnable_id', $subArea->id)
    ->first();

check("merged comment contains BOTH original strings",
    fn() => str_contains($mergedReturn->comment, 'first comment')
         && str_contains($mergedReturn->comment, 'second comment')
         ? true : "comment was: " . $mergedReturn->comment
);

check("the latest returner_role becomes 'director' (last writer wins)",
    fn() => $mergedReturn->returned_by_role === 'director' ?: 'role was: ' . $mergedReturn->returned_by_role
);

echo "\n";

// ── 11. AreaController loadActiveReturns shape ────────────────────────────
echo "10. AreaController payload shape sanity\n";

$reflect = new ReflectionClass(\App\Http\Controllers\Admin\AreaController::class);
$method  = $reflect->getMethod('loadActiveReturns');
$method->setAccessible(true);

$ctrl = new \App\Http\Controllers\Admin\AreaController();
$grouped = $method->invoke($ctrl, [$subArea->id], [$program->id]);

check("loadActiveReturns returns nested array keyed by program_id",
    fn() => is_array($grouped) && isset($grouped[$program->id]) ?: 'shape wrong: ' . json_encode($grouped)
);

check("entry has 'sub_area:N' key for the active return",
    fn() => isset($grouped[$program->id]["sub_area:{$subArea->id}"]) ?: 'missing key'
);

check("entry contains expected keys (comment, returned_by, returned_by_role, returned_at)",
    function() use ($grouped, $program, $subArea) {
        $r = $grouped[$program->id]["sub_area:{$subArea->id}"] ?? null;
        if (!$r) return 'no record';
        foreach (['id','comment','returned_by','returned_by_role','returned_at'] as $k) {
            if (!array_key_exists($k, $r)) return "missing {$k}";
        }
        return true;
    }
);

echo "\n";

// ── 12. Cleanup ───────────────────────────────────────────────────────────
echo "11. Cleanup\n";
DB::table('revision_returns')
    ->where('sub_area_id', $subArea->id)
    ->where('program_id', $program->id)
    ->delete();
if ($otherProgram) {
    DB::table('revision_returns')
        ->where('sub_area_id', $subArea->id)
        ->where('program_id', $otherProgram->id)
        ->delete();
}
echo "  ↪ Test rows deleted.\n\n";

// ── Summary ───────────────────────────────────────────────────────────────
$total = $pass + $fail + $skip;
echo "════════════════════════════════════════════════════════════════════════\n";
echo "  SUMMARY: {$pass} passed, {$fail} failed, {$skip} skipped of {$total}\n";
echo "════════════════════════════════════════════════════════════════════════\n";

exit($fail > 0 ? 1 : 0);
