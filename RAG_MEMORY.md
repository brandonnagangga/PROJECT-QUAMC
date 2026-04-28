# QUAMC RAG Memory

This file is a compact working memory for the `PROJECT-QUAMC` repo. It is meant to help future scans quickly recover the app structure, workflow, and the most important places to look first.

## Project Identity

- Name: QUAMC
- Meaning: Quality Assurance and Accreditation Management System
- Type: web app for accreditation evidence, review workflow, reporting, and admin management
- Main architecture: Laravel backend + React/Inertia frontend

## Stack

- Backend: Laravel 12
- PHP: composer requires `^8.2`
- Frontend: React 19 + Inertia.js + TypeScript
- Styling: Tailwind CSS 4
- Build tool: Vite 6
- Realtime: Laravel Reverb + Echo + Pusher client
- PDF/export tooling: `dompdf`, `snappy`, `fpdf`, `fpdi`, `tcpdf`

## What The App Does

QUAMC manages accreditation work across programs, areas, and sub-areas. Users upload evidence documents into one of three slots per sub-area:

- `input`
- `process`
- `outcome`

The system supports:

- document upload and versioning
- approval and rejection
- sub-area submission workflow
- program and area management
- user and role management
- readiness reporting
- activity logging
- notifications
- theme/settings management

## Core Roles

Seeded roles from `database/seeders/RoleSeeder.php`:

- `admin` = System Admin
- `director` = QUAMC Director
- `dean` = Dean / Office Head
- `program-coordinator` = Program Area Coordinator
- `area-coordinator` = Area Coordinator

## Main Workflow Memory

### Document workflow

- A document is unique by `sub_area_id + program_id + doc_type`.
- Uploading to an existing slot creates a new `DocumentVersion`.
- New uploads and new versions start with approval status `pending`.
- Dean-level actions approve or reject document slots.
- File uploads trigger `ScanUploadedFile`.
- Realtime status events use `DocumentStatusChanged`.

### Sub-area workflow

Status flow in `SubAreaSubmissionController`:

- `draft`
- `submitted_to_dean`
- `submitted_to_director`
- `approved`

Return states:

- `returned_by_dean`
- `returned`

Meaning:

- coordinators submit to dean
- dean forwards to director
- director gives final approval
- dean or director can return for revision

## Important Backend Areas

### Controllers

Admin controllers:

- `app/Http/Controllers/Admin/AreaController.php`
- `app/Http/Controllers/Admin/ProgramController.php`
- `app/Http/Controllers/Admin/UserController.php`
- `app/Http/Controllers/Admin/ActivityLogController.php`
- `app/Http/Controllers/Admin/SettingsController.php`
- `app/Http/Controllers/Admin/CycleController.php`
- `app/Http/Controllers/Admin/ThemeController.php`

User-facing controllers:

- `app/Http/Controllers/User/DashboardController.php`
- `app/Http/Controllers/User/DocumentController.php`
- `app/Http/Controllers/User/SubAreaSubmissionController.php`
- `app/Http/Controllers/User/NotificationController.php`
- `app/Http/Controllers/User/ReadinessController.php`
- `app/Http/Controllers/User/ExportController.php`

### Services

Business logic is concentrated in:

- `app/Services/DocumentService.php`
- `app/Services/AreaService.php`
- `app/Services/ProgramService.php`
- `app/Services/CycleService.php`
- `app/Services/SettingsService.php`
- `app/Services/ThemeService.php`
- `app/Services/UserService.php`
- `app/Services/AreaSurveyExportService.php`
- `app/Services/SubAreaPdfExportService.php`

### Models to remember

- `Document`
- `DocumentVersion`
- `SubArea`
- `Area`
- `Program`
- `AccreditationCycle`
- `AreaAssignment`
- `WorkflowAction`
- `Notification`
- `ActivityLog`
- `Setting`
- `User`
- `Role`

## Frontend Map

Entry point:

- `resources/js/app.tsx`

Shared layout:

- `resources/js/Layouts/AppLayout.tsx`
- `resources/js/Layouts/AuthLayout.tsx`

Theme system:

- `resources/js/contexts/ThemeContext.tsx`
- `resources/js/config/themes.ts`
- `resources/js/Pages/Admin/Theme.tsx`

Main pages:

- `Pages/Auth/Login.tsx`
- `Pages/Dashboard/Admin.tsx`
- `Pages/Dashboard/Director.tsx`
- `Pages/Dashboard/Dean.tsx`
- `Pages/Dashboard/Coordinator.tsx`
- `Pages/Documents/Index.tsx`
- `Pages/Documents/Show.tsx`
- `Pages/Documents/Upload.tsx`
- `Pages/Areas/Index.tsx`
- `Pages/Areas/Management.tsx`
- `Pages/Programs/Index.tsx`
- `Pages/Programs/Show.tsx`
- `Pages/Users/Index.tsx`
- `Pages/Logs/Index.tsx`
- `Pages/Notifications/Index.tsx`
- `Pages/Reports/Readiness.tsx`
- `Pages/Settings/Index.tsx`
- `Pages/Cycles/Index.tsx`

## Route Memory

Main web routes in `routes/web.php` include:

- auth: `/login`, `/logout`
- dashboard: `/dashboard`
- areas: `/areas`, `/areas/management`
- sub-area actions: submit, forward, approve, return
- documents: browse, upload, show, download, approve, reject
- programs: index, show, add users
- users: index, create, update, delete, assign/remove area
- notifications: list, read one, read all
- logs: `/logs`
- settings: `/settings`
- reports: `/reports/readiness`
- cycles: `/cycles`
- theme admin: `/admin/theme`

All app routes are behind `auth`, and most are inside a throttled group.

## UI / Behavior Notes

- Navigation is role-filtered in `AppLayout.tsx`.
- Notification badges can update live via Echo channel `documents`.
- The app includes seasonal/themed UI behavior.
- Dashboard page selection is role-based in `DashboardController`.
- Progress calculations assume 3 document slots per sub-area.

## Data Model Notes

- `Document` uses UUIDs.
- `DocumentVersion` holds actual file metadata and per-version notes.
- Document downloads are protected against path traversal in `DocumentService`.
- `SubArea::slotsForProgram()` returns the fixed three-slot map.

## Security / Ops Notes

- There are dedicated security docs in the root:
  - `SECURITY_AUDIT.md`
  - `SECURITY_FIXES_APPLIED.md`
  - `SECURITY_IMPLEMENTATION_COMPLETE.md`
- Middleware includes `SecurityHeaders`.
- File type validation checks MIME from file content, not only extension.
- Uploaded file names are randomized before storage.

## Docs Present

Existing docs folder contents:

- `docs/INSTALLATION.md`
- `docs/DOCKER.md`
- `docs/DEVELOPMENT.md`

Important note:

- root `README.md` references `docs/API.md` and `docs/USER_GUIDE.md`, but those files are not currently present in `docs/`.

## Useful Commands

Setup and dev commands inferred from `composer.json` and `package.json`:

```bash
composer install
npm install
php artisan key:generate
php artisan migrate --seed
composer run dev
npm run build
php artisan test
```

`composer run dev` starts:

- Laravel dev server
- queue listener
- log watcher via `pail`
- Vite dev server

## Fast Recovery Checklist

If scanning this repo again, check these first:

1. `routes/web.php`
2. `app/Http/Controllers/User/DocumentController.php`
3. `app/Http/Controllers/User/SubAreaSubmissionController.php`
4. `app/Services/DocumentService.php`
5. `resources/js/Layouts/AppLayout.tsx`
6. `resources/js/Pages/Documents/`
7. `database/seeders/RoleSeeder.php`

## Summary Memory

This is one main Laravel + React/Inertia accreditation system, not multiple separate apps. The heart of the repo is:

- role-based dashboards
- document slot/version workflow
- sub-area approval flow
- program/area administration
- readiness reporting

When making future changes, start by identifying:

- which role is affected
- whether the change is document-level or sub-area-level
- whether the backend controller/service and the matching Inertia page both need updates
