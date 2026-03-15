---
title: Changelog - IndieDesk Version History
sidebar_label: Changelog
description: Track all updates, new features and improvements in IndieDesk. Complete changelog with version history, new modules and enhancements.
keywords: [IndieDesk changelog, version history, updates, new features, Laravel 12, release notes]
---

## [v1.0.13] - 2026-03-15

### Added
- **Monthly detail tables on statistics page** — when a specific month is selected, two tables appear below the summary cards: costs (date, project/client, type, amount) and payments (date, project/client, amount); projects without a client show "Internal"; powered by new `MonthlyDetailQuery` sub-query
- **Monthly detail in PDF export** — same two tables included in the PDF when exporting a single month, followed by the month profit line; all values come from the backend (`$stats['summary']`), no logic in the view
- **Task types: `documentation`** — added to `Task::TYPES` and to all 13 `lang/*/tasks.php` files

### Maintenance
- **npm update** — 2 packages updated
- **composer update** — `livewire/blaze` v1.0.7 → v1.0.8, `sebastian/environment` v8.0.3 → v8.0.4



## [v1.0.12] - 2026-03-14   

### Added
- **Lead Follow-up module** — full CRUD for follow-up logs on lead clients; `client_followups` table with `type` (call, email, whatsapp, meeting, note), `note`, `contacted_at`; `ClientFollowup` model implements `CalendarEventable`
- **Follow-up section on client show page** — amber-bordered section visible only when `$client->isLead()`; includes quick action buttons (call, WhatsApp, email) and a chronological follow-up log; disappears automatically once the client is converted to active
- **`clientFollowupModal` Alpine.js component** — `resources/js/components/clientFollowupModal.js`; single modal handles create and edit; registered via `Alpine.data()` in `app.js`; uses `data-action`/`data-payload` pattern (no inline JS in Blade)
- **`<x-followup-type-icon>` Blade component** — accepts `:type` prop (`call`, `email`, `whatsapp`, `meeting`, `note`); replaces `@switch/@case` blocks with a PHP array map; reused in follow-up list rows and quick-action buttons
- **Google Calendar integration for follow-ups** — each follow-up row has an "Add to Calendar" link; pre-filled as an all-day event on `contacted_at` via `ClientFollowup::googleCalendarUrl()`
- **`Client::isLead()` helper** — returns `true` if `status === 'lead'`; single source of truth for conditional UI in Blade
- **Follow-up translations** — `followup` key group added to all 13 `lang/*/clients.php` files (type labels, action labels, modal titles, validation messages)

### Improved
- **`Client::whatsappUrl()` model method** — WhatsApp URL building logic (`phone_prefix` + `phone` → `wa.me/` URL) moved from Blade component to the model; single source of truth used by `<x-whatsapp-link>`, `_quick-actions.blade.php`, and any other consumer
- **`<x-whatsapp-link>` refactored** — now accepts `href` (pre-built URL) and slot text instead of `phone`+`prefix` props; component is pure display with no URL logic
- **`ClientStatsQuery` — leads excluded from total** — total client count now covers only `active` and `archived` statuses; leads are prospects, not yet clients; calculation moved entirely inside `ClientStatsQuery::handle()`, removed from the controller

## [v1.0.11] - 2026-03-13

### Added
- **Inline field editing — Project overview tab** — description and notes fields on the project show page are now editable inline without opening the modal; a dedicated `PATCH /projects/{project}/field` endpoint handles the update via `PatchProjectFieldRequest` (allowlist: `description`, `notes`); the `patchField()` method was added directly to `ProjectController`
- **`inlineField` Alpine.js component** — new `resources/js/components/inlineField.js` registered as `Alpine.data('inlineField', inlineField)` in `app.js`; accepts `patchUrl`, `fieldName`, `initialValue`, `msgSaved`, `msgError` as parameters; translated messages are passed from Blade to avoid hardcoding strings in JS
- **`ui.saved` / `ui.error_saving` translation keys** — added to all 13 language files (`lang/*/ui.php`)
- **Task types: `marketing` and `improvement`** — added to `Task::TYPES` constant and to all 13 `lang/*/tasks.php` files
- **`tasks.due_today` translation key** — added to all 13 `lang/*/tasks.php` files; shown on the due date badge when the task deadline is today

### Improved
- **Inline text newline preservation** — description and notes display divs use `whitespace-pre-wrap` so saved newlines render correctly without `nl2br`
- **Project show tab limit raised to 50** — `ProjectShowQuery::$limit` increased from 10 to 50; all "View all" threshold checks in `_tab-tasks`, `_tab-meetings`, `_tab-payments`, `_tab-costs`, `_tab-documents` updated from `> 10` to `> 50`
- **Clickable project name in project index** — project name in `_row-name.blade.php` is now a link to `projects.show`
- **Clickable client name in client cells** — `x-client-name-cell` component and `x-projects.client-badge` component now link to `clients.show`
- **Clickable project column in task / meeting / payment / cost / document indexes** — `_row-project.blade.php` in all five modules now links directly to `projects.show` with the relevant tab pre-selected (`tab=tasks`, `tab=meetings`, etc.)

### Fixed
- **Task due date badge — overdue vs. today** — `due-date.blade.php` now checks `isToday()` before `isPast()`; tasks due today show "Da fare oggi" / "Due today" instead of "Overdue"
- **Trix dark mode link dialog** — `.trix-dialog`, `.trix-dialog input`, and `.trix-dialog .trix-button` now have explicit dark-mode overrides in `app.css`; the dialog is no longer invisible on dark backgrounds

## [v1.0.10] - 2026-03-12

### Added
- **Projects — Editor tab** — new rich text editor tab on the project show page powered by Trix; supports bold, italic, links, headings, lists, quotes and inline image upload (PNG, JPG, GIF, max 20MB); content saved as HTML in the new `editor_notes` column (separate from the plain-text `notes` field)
- **Private image storage for editor** — images uploaded via the editor are stored privately (`local` disk, `editor-images/{project_id}/`); served through an authenticated route (`GET /projects/{project}/editor/images/{filename}`) with `Cache-Control: private`
- **`ProjectEditorController`** — `update`, `uploadImage`, `serveImage` methods; `UpdateEditorRequest` + `StoreEditorImageRequest` for validation
- **Trix dark mode** — full dark mode override for Trix toolbar and editor area; undo/redo group and file input hidden via CSS
- **Tab navigation overflow fix** — `_content-tabs.blade.php` nav wrapper now uses `overflow-x-auto` + `min-w-max` to prevent overflow at lower browser zoom levels

### Updated
- nesbot/carbon (3.11.1 → 3.11.3)
- laravel/framework (v12.54.0 → v12.54.1)
- prism-php/prism (v0.99.21 → v0.99.22)
- laravel/mcp (v0.6.1 → v0.6.2)
- laravel/boost (v2.2.3 → v2.3.1)
- laravel/breeze (v2.4.0 → v2.4.1)
- laravel/pint (v1.27.1 → v1.29.0)
- livewire/blaze (v1.0.4 → v1.0.7)
- pestphp/pest (v4.4.1 → v4.4.2)

## [v1.0.9] - 2026-03-11

### Added
- **Taxes module** — full CRUD for tax payment tracking: amount, description, due date, paid date, reference year, optional notes, and document attachment (upload / preview / download); four stat cards (total all time, this year, unpaid amount, count this year); filters by year, paid status, and free-text search
- **Tax document attachment** — upload PDF/image documents per tax record; stored locally with a locale-aware filename prefix; supports preview, download and delete
- **Google Calendar integration for taxes** — each unpaid tax shows a calendar icon next to the due date; clicking it opens Google Calendar with the event pre-filled (title includes date, description and reference year; body includes all tax details and notes)
- **Taxes translations** — full `taxes.php` lang file in all 13 supported languages (it, en, de, fr, es, pt, nl, pl, ro, ru, uk, da, zh)

### Improved
- **Project type badge** — `<x-projects.type-badge>` now displayed in the project column of all index tables: tasks, payments, costs, meetings, timesheets, documents
- **Timesheets index** — project column now shows client name when a project is linked to a client (was missing)

### Fixed
- **Statistics MySQL compatibility** — `MonthlyBreakdownQuery` was using SQLite-only `strftime()`; replaced with a `dateExpr()` helper that outputs `DATE_FORMAT` for MySQL and `strftime` for SQLite

## [v1.0.8] - 2026-03-10

### Fixed
- **MySQL compatibility** — dashboard and statistics charts now work correctly with both SQLite and MySQL


### Updated
- barryvdh/laravel-debugbar (v4.1.1 → v4.1.3)
- guzzlehttp/psr7 (2.8.0 → 2.9.0)
- laravel/breeze (v2.3.8 → v2.4.0)
- laravel/framework (v12.53.0 → v12.54.0)
- laravel/mcp (v0.6.0 → v0.6.1)
- laravel/prompts (v0.3.13 → v0.3.14)

## [v1.0.7] - 2026-03-09

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

## [v1.0.0] - 2026-02-11

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
