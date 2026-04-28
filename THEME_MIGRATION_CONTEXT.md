# QUAMC Theme + Navigation Migration Context

This file summarizes the recent UI theming and SPA navigation changes so another AI/engineer can continue without re-discovering context.

## Goals Completed

- Moved theme switching from admin-only menu to a global header icon + right sidebar drawer.
- Made user-selected theme persist per browser (local storage), not server-wide.
- Added theme sorting behavior:
  - `Default` always first.
  - Recently used themes appear right after default.
- Removed old "recent themes" drawer list UI.
- Added `QUAMC` theme preset (navy/gold branding with white main content).
- Applied theme tokens across app shell (sidebar, top bar, content shell, progress bar, buttons).
- Fixed multiple Darkmatter contrast issues and hardcoded light surfaces.
- Converted route navigation that used `window.location` into Inertia router navigation for SPA behavior.

## Important Architecture

- Theme state and preset palette tokens are in:
  - `resources/js/contexts/ThemeContext.tsx`
- Theme drawer UI is in:
  - `resources/js/components/ThemeSidebar.tsx`
- Drawer styling is in:
  - `resources/css/layout.css`
- App-level progress bar themeing is in:
  - `resources/css/app.css`
  - `resources/js/app.tsx` (`includeCSS: false`)

## Key Theme Tokens In Use

The app now relies on CSS variables like:

- `--color-shell-bg`
- `--color-panel-bg`
- `--color-panel-border`
- `--color-background`
- `--color-border`
- `--color-text`
- `--color-text-secondary`
- `--color-hover`
- `--color-sidebar-*`
- `--color-button-primary-*`
- `--color-button-secondary-*`

Darkmatter and QUAMC behavior depends on these tokens being used instead of hardcoded `#fff`/light colors.

## SPA Navigation Fixes

### Root cause addressed

- `routes/web.php` had duplicate `GET /` routes, including a redirect to `/dashboard`, which could cause inconsistent first-click reload behavior.
- Fixed by removing the redirect duplicate and keeping direct dashboard routes.

### Sidebar dashboard target

- Sidebar `Dashboard` now points directly to `/dashboard` instead of `/`.

### `window.location*` conversions

Converted navigation/reload paths to Inertia router usage in:

- `resources/js/Pages/Notifications/Index.tsx`
- `resources/js/Pages/Users/Index.tsx`
- `resources/js/Pages/Admin/Theme.tsx`
- `resources/js/Pages/Documents/Index.tsx`
- `resources/js/Pages/Dashboard/Coordinator.tsx`
- `resources/js/Pages/Dashboard/Dean.tsx`
- `resources/js/Pages/Dashboard/admin/RecentUploadsPanel.tsx`
- `resources/js/Layouts/AppLayout.tsx` (current path now from `usePage().url`)

Remaining `window.location` reference in:

- `resources/js/echo.ts` (`window.location.hostname`) is intentional websocket host config, not route navigation.

## Documents Page Darkmatter Work

`resources/js/Pages/Documents/Index.tsx` was updated so both folder and list modes adopt theme tokens:

- Breadcrumb text and chevrons now theme-aware.
- Program/area/sub-area cards use `panel`/`border`/`text` tokens.
- List mode tabs, mode toggle, search/filter controls, table shell, headers, rows, and text now use theme tokens.

## Other Darkmatter Surface Sweeps

White cards/panels replaced with theme tokenized surfaces across several pages/components:

- `resources/js/Pages/Programs/Index.tsx`
- `resources/js/Pages/Standards/Index.tsx`
- `resources/js/Pages/Reports/Readiness.tsx`
- `resources/js/Pages/Cycles/Index.tsx`
- `resources/js/Pages/Logs/Index.tsx`
- `resources/js/Pages/Settings/Index.tsx`
- `resources/js/Pages/Users/components/UsersSummaryCards.tsx`
- `resources/js/Pages/Users/components/UsersTable.tsx`
- `resources/js/Pages/Users/styles.ts`
- `resources/js/Pages/Dashboard/admin/ProgramOversightTable.tsx`

## Current Known Gaps

- There are still some pages/components in the repo with hardcoded light styles that were not part of this targeted pass.
- Future cleanup should continue replacing hardcoded backgrounds/borders/text in untouched pages with the same token system.

## Verification Pattern

After each significant patch, build was run with:

```bash
npm run build
```

All recent changes compiled successfully.
