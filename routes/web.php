<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\DocumentController;
use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\User\SubAreaSubmissionController;
use App\Http\Controllers\Admin\ProgramController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StandardController;
use App\Http\Controllers\User\ReadinessController;
use App\Http\Controllers\Admin\CycleController;
use App\Http\Controllers\User\DocumentEvaluationController;
use App\Http\Controllers\User\ExportController;
use App\Http\Controllers\Admin\ThemeController;
use App\Http\Controllers\User\NetworkGraphController;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Auth
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {

    // Redirect root to dashboard
    Route::get('/', fn() => redirect('/dashboard'));

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.alias');

    // ── Areas (global — Director manages structure) ──
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/areas', [AreaController::class, 'index'])->name('areas.index');
        Route::get('/areas/management', [AreaController::class, 'management'])->name('areas.management');
        Route::post('/areas', [AreaController::class, 'store'])->name('areas.store');
        Route::put('/areas/{area}', [AreaController::class, 'update'])->name('areas.update');
        Route::post('/areas/{area}/archive', [AreaController::class, 'archive'])->name('areas.archive');


        // ── Sub-areas (Director CRUD, workflow for submission) ──
        Route::post('/areas/{area}/sub-areas', [SubAreaSubmissionController::class, 'store'])->name('sub-areas.store');
        Route::put('/sub-areas/{subArea}', [SubAreaSubmissionController::class, 'update'])->name('sub-areas.update');
        Route::post('/sub-areas/{subArea}/archive', [SubAreaSubmissionController::class, 'archive'])->name('sub-areas.archive');

    // Sub-area workflow (submission flow)
    Route::post('/sub-areas/{subArea}/submit', [SubAreaSubmissionController::class, 'submit'])->name('sub-areas.submit');
    Route::post('/sub-areas/{subArea}/forward', [SubAreaSubmissionController::class, 'forwardToDirector'])->name('sub-areas.forward');
    Route::post('/sub-areas/{subArea}/approve', [SubAreaSubmissionController::class, 'approveDirector'])->name('sub-areas.approve');
    Route::post('/sub-areas/{subArea}/return', [SubAreaSubmissionController::class, 'returnSubArea'])->name('sub-areas.return');
    Route::post('/sub-areas/{subArea}/note', [SubAreaSubmissionController::class, 'updateNote'])->name('sub-areas.note');

        // ── Exports ──
        Route::get('/export/sub-area/{subArea}', [ExportController::class, 'subArea'])->name('export.subArea');
        Route::get('/export/area/{area}', [ExportController::class, 'area'])->name('export.area');


        // ── Documents ──
        Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/upload-data', [DocumentController::class, 'uploadModalData'])->name('documents.upload-data');
        Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/upload', [DocumentController::class, 'uploadPage'])->name('documents.upload');
        Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
        Route::get('/documents/{document}/versions/{version}/download', [DocumentController::class, 'downloadVersion'])->name('documents.downloadVersion');
        Route::post('/documents/{document}/approve', [DocumentController::class, 'approve'])->name('documents.approve');
        Route::post('/documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');
        Route::post('/documents/{document}/analyze', [DocumentEvaluationController::class, 'store'])->name('documents.analyze');

        // ── Programs ──
        Route::get('/programs', [ProgramController::class, 'index'])->name('programs.index');
        Route::post('/programs', [ProgramController::class, 'store'])->name('programs.store');
        Route::get('/programs/{program}', [ProgramController::class, 'show'])->name('programs.show');
        Route::post('/programs/{program}/users', [ProgramController::class, 'addUser'])->name('programs.addUser');

        // ── Users ──
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/export', [UserController::class, 'export'])->name('users.export');
        Route::post('/users/{user}/toggle', [UserController::class, 'toggleActive'])->name('users.toggle');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/{user}/assign-area', [UserController::class, 'assignArea'])->name('users.assignArea');
        Route::delete('/users/{user}/remove-area/{area}', [UserController::class, 'removeArea'])->name('users.removeArea');

        // ── Notifications ──
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.markRead');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.markAllRead');

        // ── Activity Logs ──
        Route::get('/logs', [ActivityLogController::class, 'index'])->name('logs.index');

        // ── Settings ──
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');

    // ── Reports ──
    Route::get('/reports/readiness', [ReadinessController::class, 'index'])->name('reports.readiness');
    Route::get('/reports/readiness/export', [ReadinessController::class, 'export'])->name('reports.readiness.export');
    Route::get('/reports/readiness/export/{program}', [ReadinessController::class, 'exportProgram'])->name('reports.readiness.exportProgram');

        // ── Accreditation Cycles ──
        Route::get('/cycles', [CycleController::class, 'index'])->name('cycles.index');
        Route::post('/cycles', [CycleController::class, 'store'])->name('cycles.store');
        Route::put('/cycles/{cycle}', [CycleController::class, 'update'])->name('cycles.update');
        Route::post('/cycles/{cycle}/activate', [CycleController::class, 'activate'])->name('cycles.activate');
        Route::delete('/cycles/{cycle}', [CycleController::class, 'destroy'])->name('cycles.destroy');

        // ── Theme Management ──
        Route::get('/admin/theme', [ThemeController::class, 'index'])->name('admin.theme.index');
        Route::post('/admin/theme', [ThemeController::class, 'update'])->name('admin.theme.update');
        Route::get('/standards', [StandardController::class, 'index'])->name('standards.index');
        Route::post('/standards', [StandardController::class, 'store'])->name('standards.store');

        // ── Network Graph Visualization ──
        Route::get('/network-graph', [NetworkGraphController::class, 'index'])->name('network-graph.index');
    });
});
