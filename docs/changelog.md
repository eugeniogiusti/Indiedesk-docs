---
title: Changelog - IndieDesk Version History
sidebar_label: Changelog
description: Track all updates, new features and improvements in IndieDesk. Complete changelog with version history, new modules and enhancements.
keywords: [IndieDesk changelog, version history, updates, new features, Laravel 12, release notes]
---

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
