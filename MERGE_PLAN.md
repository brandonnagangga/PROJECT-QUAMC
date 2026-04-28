# Merge Plan: `rag` (`latest update`) + `origin/main`

## Rule Set
- UI shell/layout/header: keep **mine**.
- Functional/backend logic: take **incoming main**.

## Ours (UI priority)
- `resources/js/Layouts/AppLayout.tsx`
- `resources/js/Layouts/AuthLayout.tsx`
- `resources/css/app.css`
- `resources/css/layout.css`
- `resources/js/Pages/Dashboard/**`
- `resources/js/Pages/Settings/**`
- `resources/js/Pages/Users/**`
- `resources/js/Pages/Documents/**`
- `resources/js/Pages/Logs/**`
- `resources/js/Pages/Notifications/**`

## Theirs (functionality priority)
- `app/**`
- `routes/**`
- `database/**`
- `config/**`
- `bootstrap/**`
- `package-lock.json`, `package.json`, `composer.*`
- Everything not listed in UI priority.

## Execution
1. `git merge --no-ff --no-commit origin/main`
2. Resolve conflicts by policy (`ours` UI, `theirs` functionality).
3. Validate:
   - `composer dump-autoload`
   - `php artisan route:list`
   - `npm run build` (if possible)
4. Commit merge.

