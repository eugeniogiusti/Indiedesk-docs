---
title: Changelog - IndieDesk Version History
sidebar_label: Changelog
description: Track all updates, new features and improvements in IndieDesk. Complete changelog with version history, new modules and enhancements.
keywords: [IndieDesk changelog, version history, updates, new features, Laravel 12, release notes]
---

## [v1.3.0] - 2026-08-14

### Added
- **Tax estimation engine (regime forfettario)** — new `PaymentTaxCalculator` (`app/Services/Taxes`) estimates INPS (Gestione Separata) contributions and imposta sostitutiva on paid payments, progressively on the cumulative taxable income of the fiscal year rather than per payment in isolation, so the annual INPS ceiling and the tax base (net of INPS due so far) are handled correctly. Rates come from `BusinessSettings` (`profitability_coefficient`, new `inps_rate`, `substitute_tax_rate`, optional `inps_ceiling`) — no hardcoded fallback rate; if any is left unset, no estimate is shown anywhere rather than guessing. Specific to the Italian regime forfettario and documented as such — a different tax regime needs dedicated development, not a config change
- **"Da accantonare" (set aside) shown wherever a payment amount is shown** — inline under the amount (not a separate table column — first design, changed after review) on the project show Payments tab, the global Payments index, the client show Recent Payments card, and the Dashboard Recent Payments list, all via one shared Blade partial
- **Net profit (after estimated tax)** wherever profit is reported business-wide: Dashboard "Profit This Month" card, Statistics summary card, monthly breakdown table and PDF export — net of estimated tax when the fiscal rates are configured, gross otherwise, computed once per query (`display_profit`) instead of duplicated in every view. Deliberately left gross on the per-project Profit tab and the "Top 10 Most Profitable Projects" table, where a project's share of the cumulative/progressive tax isn't a well-defined number
- **Tax Fund tracker** — new `TaxFundMovement` model/table + `TaxFundService`; a card on the Statistics page compares the balance of a dedicated tax savings account (manually logged deposits/withdrawals) against the current year's estimated liability, net of whatever's already been paid through the Taxes module (matched by `reference_year`, not payment date, so a late payment settling a *past* year's liability never distorts the current year's target). Marking a `Tax` record as paid auto-creates/updates/removes the matching withdrawal (`TaxFundService::syncFromTax()`) — no double data entry between the two modules; auto-generated movements can't be deleted directly, only by unmarking the source tax as unpaid

### Fixed
- **Two pre-existing migrations broke the SQLite test database** (unrelated to the tax feature, found while adding tests for it) — `costs.recurring` needed an explicit `dropIndex` before `dropColumn`, and a MySQL-only `ALTER TABLE ... ENUM(...)` on `clients.status` had no SQLite equivalent. Fixed by guarding the latter on `DB::getDriverName()`; the test suite now actually boots and runs on SQLite (it silently failed on every single test before this)

### Maintenance
- **composer update** — laravel/framework v12.65.0→v12.66.0, laravel/mcp v0.9.2→v0.9.3, laravel/pint v1.30.4→v1.30.5, laravel/sail v1.65.0→v1.66.0, league/commonmark 2.9.0→2.10.0, myclabs/deep-copy 1.13.4→1.14.0, stripe/stripe-php v21.1.1→v21.2.0
- **npm update** — alpinejs 3.15.12→3.16.1, laravel-vite-plugin 3.1.3→3.2.0, rolldown 1.2.3→1.2.4 (+ all platform bindings), @oxc-project/types 0.143.0→0.144.0, ansi-regex 6.2.2→6.3.0, baseline-browser-mapping 2.11.12→2.11.14, electron-to-chromium 1.5.402→1.5.406, update-browserslist-db 1.3.0→1.3.1

## [v1.2.0] - 2026-08-08

### Added
- **Stripe integration — automatic payment recording from your own SaaS products** — new module (`docs/modules/stripe`); `POST /stripe/webhook` receives `invoice.paid` events and creates `Payment` records automatically, no manual entry. Project routing is metadata-based: tag each Stripe Product with `indiedesk_project_id` (in the Stripe Dashboard, no local mapping table) — supports SaaS setups with one Product per pricing tier, all tagged with the same project id. Client matching, in order: `stripe_customer_id` (once known) → email (reliable at payment time — the SaaS tenant already exists) → name (fallback for prospects still on a placeholder email) → create new. Any match or creation sets the client's status to `active` regardless of prior status. Idempotent via `payments.reference` (the Stripe invoice id) — safe against Stripe's webhook retries. Built with `stripe/stripe-php`, verified with real Stripe CLI test-mode payments during development (not just synthetic fixtures)
- **`clients.stripe_customer_id`** — nullable, unique column; new `Client::getStripeDashboardUrl()` (test/live aware) and `Client::totalProjectsCount()` (direct + SaaS-pivot projects)
- **Client show page — "Connected to Stripe" badge** — shown in the header when `stripe_customer_id` is set, links directly to that customer's record in the Stripe Dashboard

### Fixed
- **Client show header project count wrong for SaaS-only clients** — read `$client->projects->count()` (direct relation only); a client linked to a project solely through the SaaS pivot showed 0. Now uses `Client::totalProjectsCount()`

### Maintenance
- **composer require** — `stripe/stripe-php` (^21.1)

## [v1.1.0] - 2026-08-08

### Added
- **Project type: `saas` — multi-client projects** — a project can now be `type = 'saas'` and linked to **multiple** clients instead of the single legacy `client_id`; new `client_project` pivot table (`Project::clients()` / `Client::saasProjects()` `belongsToMany`), synced on `store`/`update` only when `type === 'saas'` (cleared via `sync([])` when a project's type changes away from `saas`, so no stale links survive a type switch); `Project::getClientLabel()` centralizes "which client(s) to show" (single client, comma-joined SaaS clients, or null for internal) and is used everywhere a project's client is displayed instead of reading `project->client` directly
- **Payments — per-payment client attribution** — nullable `client_id` on `payments` (`Payment::client()`); on SaaS projects the payment form shows a dropdown restricted to that project's linked clients ("this payment belongs to..."); `Payment::getClientLabel()` prefers the payment's own client, falling back to the project's — used in dashboard lists and statistics tables so a SaaS payment attributed to a specific client shows that client, not a blank field
- **Project modal — client picker switches with project type** — non-SaaS types keep the existing single-client typeahead (`clientSearch.js`); selecting `saas` swaps it for a new multi-client picker (`clientMultiSearch.js`) that accumulates selections as removable chips and submits `client_ids[]`, instead of replacing a single value
- **Documents — Word/Excel inline preview** — `.docx`/`.xlsx`/`.xls` uploads (previously rejected outright by validation) are now accepted and, on preview, converted to PDF on the fly by the new `OfficeDocumentConverter` service (`phpoffice/phpword` + `phpoffice/phpspreadsheet`, rendered through the existing Dompdf dependency — no external binary, no LibreOffice to install/maintain) so they render inline like a native PDF instead of forcing a download; converted PDFs are cached in `storage/app/previews/` and purged when the source document is deleted. Shared by project Documents, Task Documents, and Business Documents. Legacy `.doc` is accepted but not convertible (no reliable PHP reader for the old binary format); PowerPoint was evaluated and deliberately left unsupported — no PHP library produces a reliable PDF export from `.pptx`
- **Clients — Excel export** — "Export Excel" button on the clients index, honors whatever filters are currently applied (reuses `ClientIndexQuery::query()`, extracted from `handle()` for this purpose); built with the same `phpoffice/phpspreadsheet` dependency as the Word/Excel preview above; headers, sheet title, filename and cell values are all resolved via `__()` — follows the requesting user's locale, not hardcoded to Italian

### Improved
- **Project show page — vertical tab navigation** — the horizontal tab bar (top of the content area) is now a vertical nav in the sidebar (`_tabs-nav.blade.php`); `activeTab` moved to a shared `x-data` on the common parent grid so the sidebar nav and the tab content (now siblings, not nested) stay in sync without an event bus
- **Project show page — Overview tab reorganized** — client info card now sits alone at the top (previously shared a 3-column row with Quick Info and Quick Links, which didn't scale); Quick Info and Quick Links moved below Description/Notes; the SaaS client card itself is a scrollable name-only list linking to each client's show page (tested with 200 linked clients) instead of the full `<x-client-summary>` contact card repeated per client
- **Clients table — "Creato il" column merged under Nome** — same treatment applied consistently elsewhere this release (Tasks: Tipo under Titolo; Payments: Metodo under Importo) to reclaim horizontal space
- **Project client filter/search now SaaS-aware** — `Project::scopeForClient()` and `ProjectIndexQuery`'s search now also match via the `clients` pivot, not just the direct `client_id`

### Fixed
- **Client show page missing SaaS-linked projects** — `ClientShowQuery` computed the client's project set from `$client->projects()` only (the direct `client_id` relation); a client linked to a project solely through the SaaS pivot showed zero projects, and by extension zero tasks/payments/costs/documents from that project. Now merges in `$client->saasProjects()->pluck('projects.id')`
- **`/clients?client_id=...` filter was a no-op** — `Project::scopeForClient()` existed but `ProjectIndexQuery` never called it; the "view all projects" link from a client's show page silently ignored the filter. Now wired via `when(request('client_id'), ...)`

### Maintenance
- **composer require** — `phpoffice/phpspreadsheet` (^5.9), `phpoffice/phpword` (^1.4), plus transitive `composer/semver` 3.4.4, `maennchen/zipstream-php` 3.2.2, `markbaker/complex` 3.0.2, `markbaker/matrix` 3.0.1, `phpoffice/math` 0.3.0
- **composer update** — barryvdh/laravel-debugbar v4.4.0→v4.4.1, guzzlehttp/guzzle 7.15.2→7.15.3, guzzlehttp/promises 2.5.1→2.5.2, laravel/boost v2.4.13→v2.5.3, laravel/framework v12.64.0→v12.65.0, laravel/mcp v0.9.1→v0.9.2, laravel/pint v1.30.3→v1.30.4, laravel/prompts v0.3.21→v0.3.22, laravel/roster v0.5.1→v1.0.0, laravel/sail v1.64.0→v1.65.0, league/commonmark 2.8.3→2.9.0, nesbot/carbon 3.13.1→3.13.2, pestphp/pest v4.7.7→v4.7.8, symfony/console v7.4.15→v7.4.16, symfony/http-foundation v7.4.15→v7.4.16, symfony/http-kernel v7.4.15→v7.4.16, symfony/mime v7.4.15→v7.4.16, symfony/translation v8.1.1→v8.1.4
- **npm update** — vite 8.2.0→8.2.1, vue 3.5.40→3.5.41, rolldown 1.2.2→1.2.3, postcss 8.5.25→8.5.26, browserslist 4.28.7→4.28.8, dompurify 3.4.12→3.4.13, nanoid 3.3.17→3.3.18, and other transitive browser-compat/build tooling packages

## [v1.0.19] - 2026-04-19
### Maintenance
- **composer update**

  - Upgrading symfony/polyfill-mbstring (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading php-debugbar/php-debugbar (v3.7.0 => v3.7.4): Extracting archive
  - Upgrading voku/portable-ascii (2.0.3 => 2.1.0): Extracting archive
  - Upgrading symfony/polyfill-php80 (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-ctype (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-uuid (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-php85 (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-php84 (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-php83 (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-intl-normalizer (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-intl-idn (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading symfony/polyfill-intl-grapheme (v1.33.0 => v1.36.0): Extracting archive
  - Upgrading nesbot/carbon (3.11.3 => 3.11.4): Extracting archive
  - Upgrading laravel/serializable-closure (v2.0.10 => v2.0.12): Extracting archive
  - Upgrading barryvdh/laravel-debugbar (v4.2.4 => v4.2.6): Extracting archive
  - Upgrading sebastian/environment (8.0.4 => 8.1.0): Extracting archive
  - Upgrading sebastian/comparator (7.1.4 => 7.1.6): Extracting archive
  - Upgrading phpunit/php-code-coverage (12.5.3 => 12.5.6): Extracting archive
  - Upgrading phpunit/phpunit (12.5.16 => 12.5.23): Extracting archive
  - Upgrading laravel/mcp (v0.6.5 => v0.6.7): Extracting archive
  - Upgrading laravel/boost (v2.4.1 => v2.4.4): Extracting archive
  - Upgrading laravel/sail (v1.56.0 => v1.57.0): Extracting archive
  - Upgrading nunomaduro/collision (v8.9.2 => v8.9.3): Extracting archive
  - Upgrading webmozart/assert (2.1.6 => 2.3.0): Extracting archive
  - Upgrading pestphp/pest-plugin-arch (v4.0.0 => v4.0.2): Extracting archive
  - Upgrading pestphp/pest (v4.4.5 => v4.6.3): Extracting archive

## [v1.0.18] - 2026-04-06

### Improved
- **AtecoCode — `StoreAtecoCodeRequest` Form Request** — inline validation moved from `AtecoCodeController::store()` to a dedicated `StoreAtecoCodeRequest`; controller now calls `$request->validated()`

### Maintenance
- **composer update** — bacon/bacon-qr-code v3.0.4→v3.1.1, barryvdh/laravel-debugbar v4.2.1→v4.2.4, laravel/mcp v0.6.4→v0.6.5, laravel/sail v1.55.0→v1.56.0, nunomaduro/collision v8.9.1→v8.9.2, pestphp/pest v4.4.3→v4.4.5, php-debugbar/php-debugbar v3.6.1→v3.7.0, phpunit/phpunit 12.5.14→12.5.16, symfony/clock v8.0.0→v8.0.8, symfony/console v7.4.7→v7.4.8, symfony/css-selector v8.0.6→v8.0.8, symfony/error-handler v7.4.4→v7.4.8, symfony/event-dispatcher v8.0.4→v8.0.8, symfony/finder v7.4.6→v7.4.8, symfony/http-foundation v7.4.7→v7.4.8, symfony/http-kernel v7.4.7→v7.4.8, symfony/mailer v7.4.6→v7.4.8, symfony/mime v7.4.7→v7.4.8, symfony/process v7.4.5→v7.4.8, symfony/routing v7.4.6→v7.4.8, symfony/string v8.0.6→v8.0.8, symfony/translation v8.0.6→v8.0.8, symfony/uid v7.4.4→v7.4.8, symfony/var-dumper v7.4.6→v7.4.8, symfony/yaml v8.0.6→v8.0.8

## [v1.0.17] - 2026-03-31

### Added
- **Business Settings — Billing Tool URL** — new `billing_tool_url` field in the Integrations tab; stores the URL of the invoicing tool used to issue bills; migration adds nullable `billing_tool_url` column to `business_settings`; validated as `nullable|url|max:255`; translations added to all 13 language files
- **Payments — Billing Tool button** — row action button in the project payments table; opens `billing_tool_url` in a new tab; visible only when the URL is configured; injected via View Composer in `AppServiceProvider` as `$billingToolUrl` (no extra DB query, reuses the existing `BusinessSettings::current()` singleton)
- **Task type: `maintenance`** — new type for package/software updates and dependency maintenance; added to `Task::TYPES` and to all 13 `lang/*/tasks.php` files

### Improved
- **Payments — Google Calendar button for pending payments** — now visible on any payment with `paid_at` or `due_date`; uses `paid_at` if collected, falls back to `due_date` for pending
- **Payments — row actions stacked vertically** — Google Calendar, Billing Tool, Edit, and Delete icons now in a vertical column for a more compact layout
- **Payments — `reference` and `notes` placeholders** — updated in all 13 languages to reflect actual use (e.g. "Server consulting, Feature development..." / "Description of work performed..."); `notes` label updated to "Note / Descrizione" in Italian

### Maintenance
- **composer update** — barryvdh/laravel-debugbar v4.1.3→v4.2.1, brianium/paratest v7.19.2→v7.20.0, php-debugbar/php-debugbar v3.5.1→v3.6.1

## [v1.0.16] - 2026-03-29

### Improved
- **Client name links to client show page** — in `<x-client-summary>`, the client name is now a clickable link to `clients.show`; applies everywhere the component is used (project show page, etc.)
- **Task row actions stacked vertically** — Google Calendar, edit, and delete icons in the task table are now in a vertical column instead of horizontal row for a more compact layout

### Maintenance
- **composer update** — brianium/paratest v7.19.0→v7.19.2, laravel/boost v2.3.4→v2.4.1, laravel/framework v12.55.1→v12.56.0, laravel/mcp v0.6.3→v0.6.4, laravel/prompts v0.3.15→v0.3.16, laravel/sail v1.54.0→v1.55.0, league/commonmark 2.8.1→2.8.2, league/flysystem 3.32.0→3.33.0, pestphp/pest v4.4.2→v4.4.3, phpunit/phpunit 12.5.12→12.5.14, psy/psysh v0.12.21→v0.12.22

## [v1.0.15] - 2026-03-19

### Added
- **Task Documents sub-module** — file attachments for tasks; `task_documents` table with `task_id`, `name`, `file_path`, `uploaded_at`, `notes`; full upload/preview/download/delete lifecycle via `TaskDocumentController` and `TaskDocumentService` (both under `Tasks/` namespace); `StoreTaskDocumentRequest` validates file (30MB max, pdf/jpg/jpeg/png/webp/zip/7z/rar); `Task::taskDocuments()` hasMany relationship; `toFormPayload()` extended to include documents array; translations in all 13 languages (`lang/*/task_documents.php`)
- **Document indicators on task table rows** — both project show and global task index now show: eye + download icons for single attachment, paperclip with numeric badge for multiple attachments; `TaskIndexQuery` and `ProjectShowQuery` eager-load `taskDocuments`
- **Cost types: `hardware` and `meal`** — `hardware` for equipment purchases (keyboard, mouse, monitor, etc.), `meal` for business meals; `<x-costs.type-badge>` updated with slate badge (🖥️) and lime badge (🍽️); translations added to all 13 language files
- **Preview/download on client show cards** — payments, costs, tasks, and documents cards on the client show page now display inline preview and download buttons when an attachment is present (`hasInvoice()`, `hasReceipt()`, `taskDocuments`); `ClientShowQuery` eager-loads `taskDocuments` to prevent N+1; task rows follow the same single/multiple document pattern as the task index table
- **Preview/download on dashboard list cards** — same inline preview/download buttons added to recent payments, recent costs, and tasks due soon cards; `DashboardListsQuery` eager-loads `taskDocuments` on `getTasksDueSoon()`
- **Google Calendar embed URL via env** — `GOOGLE_CALENDAR_EMBED_URL` env variable replaces the hardcoded `src` in `calendar/index.blade.php`; added to `.env.example`; configuration docs updated

### Maintenance
- **composer update** — bacon/bacon-qr-code v3.0.3→v3.0.4, barryvdh/laravel-dompdf v3.1.1→v3.1.2, laravel/boost v2.3.1→v2.3.4, laravel/framework v12.54.1→v12.55.1, laravel/mcp v0.6.2→v0.6.3, laravel/prompts v0.3.14→v0.3.15, laravel/sail v1.53.0→v1.54.0, league/uri 7.8.0→7.8.1, league/uri-interfaces 7.8.0→7.8.1, livewire/blaze v1.0.8→v1.0.10, phpdocumentor/reflection-docblock 6.0.2→6.0.3, pragmarx/google2fa-laravel v2.3.0→v2.3.1
- **npm update** — 12 packages updated

## [v1.0.14] - 2026-03-16

### Added
- **Top 10 most profitable projects on statistics page** — annual view only; table shows project, client, income, costs and profit ranked by profit descending; powered by new `TopProjectsQuery` sub-query; each project name links to `projects.show`; included in PDF export as well
- **Dashboard list rows clickable** — all 5 quick lists (tasks due soon, upcoming meetings, recent payments, recent costs, overdue payments) are now fully clickable links to the relevant project tab (`projects.show?tab=*`)
- **Dashboard list badges** — tasks show `<x-tasks.type-badge>`, meetings show `<x-meetings.status-badge>`, payments show `<x-payments.method-badge>`, costs show `<x-costs.type-badge>`; no inline badge logic in Blade
- **Client show list rows clickable** — all 5 lists (tasks, meetings, payments, costs, documents) on the client show page now link to the relevant project tab

### Fixed
- **`payments.method_not_set` translation** — default label was "Da incassare" (wrong semantic); corrected to "Non specificato" / "Not specified" across all 13 languages

## [v1.0.13] - 2026-03-15

### Added
- **Monthly detail tables on statistics page** — when a specific month is selected, two tables appear below the summary cards: costs (date, project/client, type, amount) and payments (date, project/client, amount); projects without a client show "Internal"; powered by new `MonthlyDetailQuery` sub-query
- **Monthly detail in PDF export** — same two tables included in the PDF when exporting a single month, followed by the month profit line; all values come from the backend (`$stats['summary']`), no logic in the view
- **Task types: `hardware` and `documentation`** — added to `Task::TYPES` and to all 13 `lang/*/tasks.php` files
- **Cost type `travel` relabeled** — now shown as "Trasporti/Viaggi" to cover travel, commute, and transit subscriptions

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
