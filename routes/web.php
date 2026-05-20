<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\DashboardPreferencesController;
use App\Http\Controllers\User\DocumentController;
use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\AreaNoteController;
use App\Http\Controllers\AreaItemController;
use App\Http\Controllers\AreaItemResponseController;
use App\Http\Controllers\AreaItemFileController;
use App\Http\Controllers\SubAreaController;
use App\Http\Controllers\RevisionReturnController;
use App\Http\Controllers\SubAreaNoteReplyController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StandardController;
use App\Http\Controllers\User\ReadinessController;
use App\Http\Controllers\Admin\CycleController;
use App\Http\Controllers\User\ExportController;

use Illuminate\Support\Facades\Route;

// Auth
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.alias');
    Route::post('/dashboard/preferences', [DashboardPreferencesController::class, 'update'])->name('dashboard.preferences.update');
    Route::get('/global-search', [GlobalSearchController::class, 'index'])
        ->middleware('throttle:60,1')
        ->name('global-search.index');

    // ── Areas (global structure) ──
    Route::get('/areas', [AreaController::class, 'index'])->name('areas.index');
    Route::get('/areas/management', [AreaController::class, 'management'])->name('areas.management');
    Route::post('/areas', [AreaController::class, 'store'])->name('areas.store');
    Route::put('/areas/{area}', [AreaController::class, 'update'])->name('areas.update');
    Route::post('/areas/{area}/archive', [AreaController::class, 'archive'])->name('areas.archive');
    Route::post('/areas/{area}/deadline', [AreaController::class, 'setDeadline'])->name('areas.setDeadline');

    // ── Sub-areas (Director CRUD only — no submission workflow) ──
    Route::post('/areas/{area}/sub-areas', [SubAreaController::class, 'store'])->name('sub-areas.store');
    Route::put('/sub-areas/{subArea}', [SubAreaController::class, 'update'])->name('sub-areas.update');
    Route::post('/sub-areas/{subArea}/archive', [SubAreaController::class, 'archive'])->name('sub-areas.archive');

    // ── Revision Returns (replaces submit/approve/return workflow) ──
    Route::post('/returns', [RevisionReturnController::class, 'store'])->name('returns.store');
    Route::post('/returns/{return}/resolve', [RevisionReturnController::class, 'resolve'])->name('returns.resolve');

    // ── Exports ──
    Route::get('/export/sub-area/{subArea}', [ExportController::class, 'subArea'])->name('export.subArea');
    Route::get('/export/area/{area}', [ExportController::class, 'area'])->name('export.area');

    // ── IPO Item System ──
    Route::get('/sub-areas/{subArea}/items', [AreaItemResponseController::class, 'subAreaItems'])->name('sub-areas.items');
    Route::post('/area-items/{item}/response', [AreaItemResponseController::class, 'saveDraft'])->name('item-responses.saveDraft');
    Route::get('/area-items/{item}/response', [AreaItemResponseController::class, 'getResponse'])->name('item-responses.get');

    // Area-level notes (general comments — NOT the return workflow)
    Route::post('/areas/{area}/notes', [AreaNoteController::class, 'store'])->name('areas.notes.store');
    Route::post('/area-notes/{note}/reply', [AreaNoteController::class, 'storeReply'])->name('area-notes.reply');

    // Sub-area note replies (legacy)
    Route::post('/sub-areas/{subArea}/note/reply', [SubAreaNoteReplyController::class, 'store'])->name('sub-areas.note.reply');

    // Supporting evidence files
    Route::post('/item-files', [AreaItemFileController::class, 'store'])->name('item-files.store');
    Route::put('/item-files/{file}', [AreaItemFileController::class, 'update'])->name('item-files.update');
    Route::delete('/item-files/{file}', [AreaItemFileController::class, 'destroy'])->name('item-files.destroy');
    Route::get('/item-files/{file}/download', [AreaItemFileController::class, 'download'])->name('item-files.download');
    Route::get('/item-files/{file}/preview', [AreaItemFileController::class, 'preview'])->name('item-files.preview');

    // Area item CRUD (Director-only)
    Route::post('/area-items', [AreaItemController::class, 'store'])->name('area-items.store');
    Route::put('/area-items/{item}', [AreaItemController::class, 'update'])->name('area-items.update');
    Route::delete('/area-items/{item}', [AreaItemController::class, 'destroy'])->name('area-items.destroy');

    // ── Documents (no approve/reject/submit/resubmit/workflow anymore) ──
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/documents/upload-data', [DocumentController::class, 'uploadModalData'])->name('documents.upload-data');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/upload', [DocumentController::class, 'uploadPage'])->name('documents.upload');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::get('/documents/{document}/versions/{version}/download', [DocumentController::class, 'downloadVersion'])->name('documents.downloadVersion');
    Route::get('/documents/item-file/{file}/download', [DocumentController::class, 'downloadItemFile'])->name('documents.item-file.download');

    // ── Programs ──
    Route::get('/programs', [ProgramController::class, 'index'])->name('programs.index');
    Route::post('/programs', [ProgramController::class, 'store'])->name('programs.store');
    Route::get('/programs/{program}', [ProgramController::class, 'show'])->name('programs.show');
    Route::post('/programs/{program}/users', [ProgramController::class, 'addUser'])->name('programs.addUser');
    Route::post('/programs/{program}/logo', [ProgramController::class, 'uploadLogo'])->name('programs.logo.upload');
    Route::get('/programs/{program}/logo', [ProgramController::class, 'serveLogo'])->name('programs.logo');

    // ── Standards ──
    Route::get('/standards', [StandardController::class, 'index'])->name('standards.index');
    Route::post('/standards', [StandardController::class, 'store'])->name('standards.store');

    // ── Users ──
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/assign-area', [UserController::class, 'assignArea'])->name('users.assignArea');
    Route::delete('/users/{user}/remove-area/{area}', [UserController::class, 'removeArea'])->name('users.removeArea');
    Route::post('/users/{user}/assign-program', [UserController::class, 'assignProgram'])->name('users.assignProgram');

    // ── Notifications ──
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.markRead');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.markAllRead');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // ── Activity Logs ──
    Route::get('/logs', [ActivityLogController::class, 'index'])->name('logs.index');
    Route::post('/logs/client-event', [ActivityLogController::class, 'storeClientEvent'])
        ->middleware('throttle:180,1')
        ->name('logs.client-event');

    // ── Settings ──
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::get('/settings/logo', [SettingsController::class, 'logo'])->name('settings.logo');

    // ── Reports ──
    Route::get('/reports/readiness', [ReadinessController::class, 'index'])->name('reports.readiness');
    Route::get('/reports/readiness/export', [ReadinessController::class, 'export'])->name('reports.readiness.export');
    Route::get('/reports/readiness/export/{program}', [ReadinessController::class, 'exportProgram'])->name('reports.readiness.exportProgram');

    // ── Accreditation Cycles ──
    Route::get('/cycles', [CycleController::class, 'index'])->name('cycles.index');
    Route::post('/cycles', [CycleController::class, 'store'])->name('cycles.store');
    Route::put('/cycles/{cycle}', [CycleController::class, 'update'])->name('cycles.update');
    Route::post('/cycles/{cycle}/activate', [CycleController::class, 'activate'])->name('cycles.activate');
    Route::post('/cycles/{cycle}/deactivate', [CycleController::class, 'deactivate'])->name('cycles.deactivate');
    Route::delete('/cycles/{cycle}', [CycleController::class, 'destroy'])->name('cycles.destroy');
    Route::post('/cycles/{cycle}/switch', [CycleController::class, 'switchViewing'])->name('cycles.switch');

    // ── Area Evidence Checklist ──
    Route::get('/areas/{area}/checklist', [\App\Http\Controllers\User\ChecklistController::class, 'index'])->name('checklist.index');
    Route::post('/areas/{area}/checklist', [\App\Http\Controllers\User\ChecklistController::class, 'store'])->name('checklist.store');
    Route::put('/checklist/{checklist}', [\App\Http\Controllers\User\ChecklistController::class, 'update'])->name('checklist.update');
    Route::post('/checklist/{checklist}/toggle', [\App\Http\Controllers\User\ChecklistController::class, 'toggleComplete'])->name('checklist.toggle');
    Route::delete('/checklist/{checklist}', [\App\Http\Controllers\User\ChecklistController::class, 'destroy'])->name('checklist.destroy');
});
