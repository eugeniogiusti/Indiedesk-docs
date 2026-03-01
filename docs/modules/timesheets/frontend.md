---
title: Timesheets Module Frontend - IndieDesk
sidebar_label: Frontend
description: Monthly worked hours UI with Alpine.js reactive grid, earnings calculation, month/year navigation and global index with filters and stats cards.
keywords: [Alpine.js timesheets, worked hours UI, timesheet grid, hourly rate, Blade partials, IndieDesk timesheets frontend]
---

# Frontend

The Timesheets module has two UI contexts: a **global index** with filters and stat cards, and a **project tab** with the monthly hour grid.

## File Structure

```
resources/views/timesheets/
├── index.blade.php
├── pdf.blade.php                    ← PDF report (rendered by DomPDF)
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php        ← search by project name
│   │   ├── _month.blade.php         ← month select (1–12)
│   │   ├── _year.blade.php          ← year select (from availableYears)
│   │   └── _actions.blade.php       ← filter / reset buttons
│   ├── stats-cards/
│   │   ├── _hours-this-month.blade.php
│   │   ├── _earnings-this-month.blade.php
│   │   ├── _hours-this-year.blade.php
│   │   └── _earnings-this-year.blade.php
│   └── timesheet-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php   ← link to project show (correct month/year)
│       ├── _row-client.blade.php
│       ├── _row-period.blade.php    ← "January 2025"
│       ├── _row-hours.blade.php
│       └── _row-earnings.blade.php  ← "—" when no hourly_rate
└── partials/                        ← shared with the project tab
    ├── _nav.blade.php               ← month/year selector (auto-submit on change)
    ├── _no-rate-warning.blade.php   ← amber warning when hourly_rate = 0
    ├── _form.blade.php              ← Alpine.js hour grid + notes + summary
    └── _history.blade.php           ← pill links to saved months
```

## Global Index

`timesheets/index.blade.php` is the orchestrator:

```blade
@include('timesheets.index._header')
@include('timesheets.index._stats-cards')
@include('timesheets.index._filters')

@if($timesheets->count() > 0)
    @include('timesheets.index._table')
@else
    @include('timesheets.index._empty-state')
@endif
```

### Filters

The filter bar (`_filters.blade.php`) uses a `GET` form with a `md:grid-cols-5` grid:

- **search** (`md:col-span-2`) — project name
- **month** — select 1–12 with translated month names
- **year** — select from `$availableYears` (populated from DB, auto-updates each year)
- **actions** — filter submit + reset link

### Stat Cards

Four cards, each in its own partial:

| Card | Value |
|------|-------|
| Hours this month | `number_format($stats['hours_this_month'], 1)h` |
| Earnings this month | `€number_format($stats['earnings_this_month'], 2)` |
| Hours this year | `number_format($stats['hours_this_year'], 1)h` |
| Earnings this year | `€number_format($stats['earnings_this_year'], 2)` |

### Table Rows

Each row links the project name directly to the correct month on the project show page:

```blade
route('projects.show', [
    'project'  => $timesheet->project,
    'tab'      => 'timesheets',
    'ts_month' => $timesheet->month,
    'ts_year'  => $timesheet->year,
])
```

The earnings cell shows `—` (amber) when `hourly_rate = 0`, with a tooltip using `__('timesheets.no_rate_warning')`.

## Project Tab

The tab is included in `projects/show/_tab-timesheets.blade.php`, which only extracts variables from `$showData` and delegates to partials:

```blade
@include('timesheets.partials._nav')
@include('timesheets.partials._no-rate-warning')  {{-- conditional --}}
@include('timesheets.partials._form')
@include('timesheets.partials._history')          {{-- conditional --}}
```

### Month/Year Navigation (`_nav.blade.php`)

A `GET` form pointing to `projects.show` with hidden `tab=timesheets`. The month and year selects use `onchange="this.form.submit()"` for immediate navigation (same pattern as `statistics/_filters.blade.php`).

Year range is dynamic: `now()->year - 2` to `now()->year + 1`.

### Hour Grid Form (`_form.blade.php`)

Wrapped in an Alpine.js `x-data` component:

```js
{
    hours: { 1: 8, 2: 6, ... },   // from $existingHours (PHP → JSON)
    hourlyRate: 75.00,
    get totalHours() { ... },      // reactive sum
    get totalEarnings() { ... },   // reactive totalHours * hourlyRate
}
```

The form area contains two independent `<form>` elements:

- **Save form** (`id="timesheet-save-form"`) — day grid and notes textarea, POSTs to `timesheets.store`
- **Delete form** — DELETEs to `timesheets.destroy`, uses `data-confirm` for the global confirm dialog (same pattern as all other modules)

The save button sits outside the save form and is linked to it via the `form="timesheet-save-form"` attribute.

### PDF Download Button

A download link rendered only when `$currentTs` exists:

```blade
@if($currentTs)
    <a href="{{ route('timesheets.report', [$project, $currentTs]) }}" ...>
        {{ __('timesheets.report_download') }}
    </a>
@endif
```

Clicking it hits `timesheets.report` and the browser receives a streamed PDF file.

## PDF View (`pdf.blade.php`)

A standalone HTML document rendered by DomPDF (no app layout, no Tailwind). Uses `display: table` for multi-column layouts since DomPDF does not support Flexbox or CSS Grid.

| Section | Description |
|---------|-------------|
| Header | Logo image (absolute path from `storage_path`) + business name on the left; report title + month/year on the right |
| Parties | Business address/VAT on the left; project name + client on the right |
| Worked days table | One row per day with hours > 0: day number, weekday name, hours |
| Summary | Total hours, hourly rate, total amount (hidden when `hourly_rate = 0`) |
| Notes | Displayed inside a shaded box when present |
| Footer | Business name + generation date |

Font stack: `DejaVu Sans` (bundled with DomPDF) + `Noto Sans CJK` (loaded from `storage/fonts/`) for CJK character support.

## Internationalization

All frontend strings use `lang/*/timesheets.php`:

- `title`, `index_subtitle`
- `stats.*` — stat card labels
- `months.*` — month names (January–December)
- `days.*` — day abbreviations (Mon–Sun)
- `total_hours`, `rate`, `total_earnings`, `to_collect`
- `no_rate_warning`, `delete_confirm`
- `search_placeholder`, `all_months`, `all_years`
- `no_timesheets`, `no_timesheets_desc`
- `report_download`, `report_title`, `report_from`, `report_project`, `report_vat`
- `report_worked_days`, `report_day`, `report_weekday`, `report_generated`, `report_total`

## Dark Mode

All partials support dark mode via Tailwind `dark:*` classes, consistent with the application layout.
