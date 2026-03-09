---
title: Changelog - IndieDesk Version History
sidebar_label: Changelog
description: Track all updates, new features and improvements in IndieDesk. Complete changelog with version history, new modules and enhancements.
keywords: [IndieDesk changelog, version history, updates, new features, Laravel 12, release notes]
---

## [v1.0.7] - 2026-03-08

### Added
- **GitHub Integration — Repository tab** — each project with a GitHub `repo_url` now shows a dedicated Repository tab with: commit activity heatmap (52 weeks × 7 days), recent commits list (author, relative date, SHA linked to GitHub), and repo info badges (stars, forks, default branch); data is lazy-loaded via a JSON endpoint (`GET /projects/{project}/repository`) and cached 10 minutes server-side
- **GitHubService** — new `app/Services/GitHub/GitHubService.php` wrapping the GitHub REST API (`commit_activity`, `commits`, repo info endpoints) with per-repo cache and silent failure handling
- **Business Settings — Integrations tab** — new tab in Business Settings for third-party integrations; first integration: GitHub PAT (`github_pat` field) with required scopes info box
- **`repositoryTab` Alpine.js component** — registered in `app.js`, handles fetch, loading/error states, heatmap color logic, month label computation and relative date formatting

## [v1.0.6] - 2026-03-08

### Added
- **Dashboard — Recent Costs list** — new `_recent-costs.blade.php` card showing the 5 most recent registered costs (amount in red with `-`, project name, type badge, date); added `getRecentCosts()` to `DashboardListsQuery` and included costs in `hydrateProjects()` batch loading to prevent N+1 queries

### Fixed
- **Statistics PDF styles** — aligned base styles (font stack, units, line-height) with the invoice PDF for consistent typography across all PDF exports

### Updated
- **Dashboard lists layout** — reorganised from a flat 2×2 grid to 3 rows: tasks+meetings (2 cols), recent payments+recent costs (2 cols), overdue payments (full width)
- barryvdh/laravel-debugbar (v4.0.10 → v4.1.1)
- dompdf/dompdf (v3.1.4 → v3.1.5)
- laravel/boost (v2.2.1 → v2.2.3)
- laravel/mcp (v0.5.9 → v0.6.0)
- laravel/roster (v0.5.0 → v0.5.1)
- league/commonmark (2.8.0 → 2.8.1)
- livewire/blaze (v1.0.3 → v1.0.4)
- php-debugbar/php-debugbar (v3.4.1 → v3.5.1)
- phpdocumentor/reflection-docblock (6.0.1 → 6.0.2)
- prism-php/prism (v0.99.20 → v0.99.21)
- psy/psysh (v0.12.20 → v0.12.21)
- sabberworm/php-css-parser (v9.2.0 → v9.3.0)
- symfony/console (v7.4.6 → v7.4.7)
- symfony/http-foundation (v7.4.6 → v7.4.7)
- symfony/http-kernel (v7.4.6 → v7.4.7)
- symfony/mime (v7.4.6 → v7.4.7)

## [v1.0.5] - 2026-03-02

### Added
- **Timesheet PDF report** — download a monthly worked hours report as PDF directly from the project timesheet tab; includes business info, project/client details, worked days table, and total earnings; filename is locale-aware (`{report-title-slug}-{project-slug}-{mm}-{yyyy}.pdf`)
- **Blaze** — enabled `livewire/blaze` function compiler on all anonymous Blade components (`resources/views/components/`) for faster rendering pipeline

## [v1.0.4] - 2026-03-01

### Added
- **Timesheets module** — monthly worked hours tracking per project with daily hour grid, hourly rate snapshot, and reactive earnings calculation (Alpine.js)
- **Timesheets global index** — paginated list with filters (project name, month, year), four stat cards (hours/earnings this month and this year), and direct links to the correct month on the project show page

## [v1.0.3] - 2026-02-28

### Fixed
- **Clients / Projects index** — stat cards showed filtered counts when filters were active; stats now always reflect the real unfiltered totals
- **Invoice PDF** — bold text (`<strong>`, `.invoice-number`, `.description-amount`, etc.) was not rendering as bold because the `@font-face` bold declaration pointed to the same Regular TTF file

### Updated
- **Invoice PDF font** — switched primary font from Noto Sans CJK to DejaVu Sans for cleaner, more professional typography; Noto Sans CJK retained as fallback for CJK characters
- barryvdh/laravel-debugbar (v4.0.9 → v4.0.10)
- laravel/boost (v2.1.7 → v2.2.1)
- laravel/framework (v12.52.0 → v12.53.0)
- laravel/roster (v0.4.0 → v0.5.0)
- laravel/serializable-closure (v2.0.9 → v2.0.10)
- league/flysystem (3.31.0 → 3.32.0)
- livewire/blaze (v1.0.1 → v1.0.3)
- nette/schema (v1.3.4 → v1.3.5)
- pestphp/pest-plugin-laravel (v4.0.0 → v4.1.0)
- php-debugbar/php-debugbar (v3.4.0 → v3.4.1)
- phpdocumentor/reflection-docblock (5.6.6 → 6.0.1)
- phpdocumentor/type-resolver (1.12.0 → 2.0.0)
- prism-php/prism (v0.99.19 → v0.99.20)
- sabberworm/php-css-parser (v9.1.0 → v9.2.0)
- symfony/console (v7.4.4 → v7.4.6)
- symfony/css-selector (v8.0.0 → v8.0.6)
- symfony/finder (v7.4.5 → v7.4.6)
- symfony/http-foundation (v7.4.5 → v7.4.6)
- symfony/http-kernel (v7.4.5 → v7.4.6)
- symfony/mailer (v7.4.4 → v7.4.6)
- symfony/mime (v7.4.5 → v7.4.6)
- symfony/routing (v7.4.4 → v7.4.6)
- symfony/string (v8.0.4 → v8.0.6)
- symfony/translation (v8.0.4 → v8.0.6)
- symfony/var-dumper (v7.4.4 → v7.4.6)
- symfony/yaml (v8.0.1 → v8.0.6)
- webmozart/assert (2.1.5 → 2.1.6)

## [v1.0.2] - 2026-02-18

### Updated
- barryvdh/laravel-debugbar (v4.0.8 → v4.0.9)
- brianium/paratest (v7.17.0 → v7.19.0)
- laravel/boost (v2.1.4 → v2.1.7)
- laravel/framework (v12.51.0 → v12.52.0)
- laravel/mcp (v0.5.7 → v0.5.9)
- nunomaduro/collision (v8.8.3 → v8.9.1)
- nunomaduro/termwind (v2.3.3 → v2.4.0)
- pestphp/pest (v4.3.2 → v4.4.1)
- phpunit/phpunit (12.5.8 → 12.5.12)
- ta-tikoma/phpunit-architecture-test (0.8.6 → 0.8.7)
- webmozart/assert (2.1.3 → 2.1.5)

## [v1.0.1] - 2026-02-16

### Updated
- barryvdh/laravel-debugbar (v4.0.7 → v4.0.8)
- laravel/boost (v2.1.3 → v2.1.4)
- laravel/mcp (v0.5.6 → v0.5.7)
- nette/utils (v4.1.2 → v4.1.3)
- php-debugbar/php-debugbar (v3.3.1 → v3.4.0)
- thecodingmachine/safe (v3.3.0 → v3.4.0)
- webmozart/assert (2.1.2 → 2.1.3)

## [v1.0.0] - 2026-02-11 - Latest version of laravel 12.51

### Added
- Initial documentation structure
- Architecture
- Released modules (backend/frontend)
- 2FA
- AI
- Calendar
- Clients
- Company
- Costs
- Dashboard
- Documents
- Invoice
- Labels
- Meetings
- Payments
- Projects
- Receipts
- Stats
- Tasks
