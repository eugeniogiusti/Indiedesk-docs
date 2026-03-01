---
title: Timesheets Module Backend - IndieDesk
sidebar_label: Backend
description: Monthly worked hours tracking in Laravel. Project-scoped timesheet CRUD, hourly rate computation, earnings calculation and global index with filters.
keywords: [Laravel timesheets, worked hours, hourly rate, earnings, project timesheets, IndieDesk timesheets]
---

# Backend

The Timesheets module tracks monthly worked hours per project. It provides a global index with filters and statistics, and a per-project monthly timesheet with daily hour grid, notes, and earnings calculation.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Timesheets/
│   │   └── TimesheetController.php
│   └── Requests/Timesheets/
│       └── StoreTimesheetRequest.php
├── Models/
│   └── Timesheet.php
├── Queries/Timesheets/
│   ├── TimesheetIndexQuery.php
│   └── TimesheetStatsQuery.php
└── Services/Timesheets/
    └── TimesheetReportGenerator.php
```

The project-show data preparation lives in:

```
app/Queries/Projects/
└── ProjectShowQuery.php  ← getTimesheetData(), buildWeekGrid()
```

## Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| GET | `/timesheets` | `timesheets.index` | Global paginated timesheet list with filters |
| GET | `/projects/{project}/timesheets/{timesheet}/report` | `timesheets.report` | Download monthly timesheet as PDF |
| POST | `/projects/{project}/timesheets` | `timesheets.store` | Create or update monthly timesheet |
| DELETE | `/projects/{project}/timesheets/{timesheet}` | `timesheets.destroy` | Delete monthly timesheet |

## Controller

`TimesheetController` uses the **Query Classes** pattern.

### Methods

- **index()** — uses `TimesheetIndexQuery` for the paginated list, `TimesheetStatsQuery` for stat cards, and `availableYears()` for the year filter select
- **report()** — delegates to `TimesheetReportGenerator::download()` and streams the PDF response
- **store()** — validates with `StoreTimesheetRequest`, calls `updateOrCreate` on the project's timesheets, redirects to `projects.show?tab=timesheets&ts_month=X&ts_year=Y`
- **destroy()** — deletes the timesheet, redirects to `projects.show?tab=timesheets`

## Model

`app/Models/Timesheet.php`

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | integer | Owning project |
| `year` | integer | Year of the timesheet |
| `month` | integer | Month (1–12) |
| `daily_hours` | array (JSON) | Keyed by day number (`{1: 8, 2: 6, ...}`) |
| `hourly_rate` | decimal | Rate at time of saving (snapshot from project) |
| `notes` | string | Optional monthly notes |

### Methods

- **totalHours()** — `array_sum(daily_hours)`
- **totalEarnings()** — `totalHours() * hourly_rate`

### Relationship

- `project()` — `belongsTo(Project::class)`

## Form Request

### StoreTimesheetRequest

| Field | Rules |
|-------|-------|
| `year` | required, integer, 2000–2100 |
| `month` | required, integer, 1–12 |
| `daily_hours` | nullable, array |
| `daily_hours.*` | nullable, numeric, 0–24 |
| `notes` | nullable, string |

`prepareForValidation()` filters out empty and zero values from `daily_hours` before validation.

## Query Classes

### TimesheetIndexQuery

Paginated list (20 per page) with:
- eager loading `project.client`
- search by project name (`LIKE`)
- filter by `year`
- filter by `month`
- sorting: `year desc`, `month desc`
- `withQueryString()` to preserve filters across pagination

Also exposes `availableYears(): array` — distinct years from existing timesheets, used to populate the year select.

### TimesheetStatsQuery

Computes statistics in PHP (not SQL) because `daily_hours` is stored as JSON:

| Key | Description |
|-----|-------------|
| `hours_this_month` | Sum of all hours in current month/year |
| `earnings_this_month` | Sum of `totalHours * hourly_rate` for current month/year |
| `hours_this_year` | Sum of all hours in current year |
| `earnings_this_year` | Sum of earnings in current year |

Fetches only `daily_hours` and `hourly_rate` columns for efficiency.

## PDF Report

`TimesheetReportGenerator` (in `app/Services/Timesheets/`) handles PDF generation via **DomPDF** (`barryvdh/laravel-dompdf`).

### Download flow

1. Loads `project.client` and `BusinessSettings::current()`
2. Builds `$workedDays` — filters `daily_hours` to days > 0, resolves ISO weekday name via Carbon, sorts by day
3. Renders `timesheets.pdf` Blade view with all data
4. Streams the PDF via `response()->streamDownload()` with a locale-aware filename

### Filename format

```
{report_title_slug}-{project_slug}-{mm}-{yyyy}.pdf
```

`report_title_slug` is generated from `Str::slug(__('timesheets.report_title'))`, so it follows the active locale (e.g. `report-ore-lavorate` in Italian, `worked-hours-report` in English).

### PDF layout

| Section | Content |
|---------|---------|
| Header | Business logo + name (left) · Report title + month/year (right) |
| Parties | Business address/VAT (left) · Project name + client (right) |
| Worked days table | Day number, weekday name, hours — one row per worked day |
| Summary | Total hours · Hourly rate · **Total** (hours × rate) |
| Notes | Displayed only when `$timesheet->notes` is set |
| Footer | Business name + generation date |

## Project Show Integration

The timesheet tab on the project show page is driven by `ProjectShowQuery::getTimesheetData()`:

- reads `ts_month` and `ts_year` from the request (defaulting to current month/year)
- loads the current timesheet (`currentTimesheet`) and its existing hours
- calls `buildWeekGrid(month, year)` to produce a week-by-week grid for the calendar table
- computes `totalHours`, `totalEarnings`, `hourlyRate`, `monthNames`
- returns everything as an array merged into `$showData`

`buildWeekGrid()` uses Carbon to map each day to its ISO day-of-week (1=Monday, 7=Sunday), grouping days into weekly rows with `null` for empty cells.

## Hourly Rate Snapshot

When a timesheet is saved, `hourly_rate` is copied from `$project->hourly_rate` at that moment. This means historical earnings remain accurate even if the project rate changes later.
