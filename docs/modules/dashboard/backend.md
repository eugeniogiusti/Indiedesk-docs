---
title: Dashboard Module Backend - IndieDesk
sidebar_label: Backend
description: Laravel dashboard with aggregated stats, charts and KPIs. Query orchestrator pattern for projects, tasks, payments and meetings overview.
keywords: [Laravel dashboard, dashboard overview, Laravel statistics, dashboard charts, IndieDesk dashboard, KPI dashboard, analytics dashboard]
---

# Backend

The Dashboard module aggregates data from all main modules (projects, tasks, payments, costs, meetings) into a summary view. It uses 3 dedicated query classes to separate responsibilities.

## File Structure

```
app/
├── Http/Controllers/Dashboard/
│   └── DashboardController.php
└── Queries/Dashboard/
    ├── DashboardStatsQuery.php
    ├── DashboardListsQuery.php
    └── DashboardChartQuery.php
```

## Routes

| Method | URI | Controller | Action | Description |
|--------|-----|------------|--------|-------------|
| GET | `/dashboard` | DashboardController | `index` | Main dashboard page |

Middleware: `auth`, `verified`, `2fa`.

## Controller

`DashboardController` has a single `index()` method that:
1. Instantiates the 3 query classes
2. Calls `handle()` on each one
3. Passes `$stats`, `$lists`, `$chart` to the view

```php
public function index()
{
    $stats = (new DashboardStatsQuery())->handle();
    $lists = (new DashboardListsQuery())->handle();
    $chart = (new DashboardChartQuery())->handle();

    return view('dashboard.index', compact('stats', 'lists', 'chart'));
}
```

## DashboardStatsQuery

Calculates KPIs for the stat cards. Returns an array with 5 keys:

| Key | Type | Content |
|-----|------|---------|
| `profit_this_month` | `array` | `amount`, `payments`, `costs` of the current month |
| `pending_payments` | `array` | `count`, `total`, `overdue_count` of pending payments |
| `active_projects` | `int` | Count of projects with `in_progress` status |
| `open_tasks` | `array` | `total`, `todo`, `in_progress`, `blocked` |
| `meetings_this_week` | `int` | Count of meetings scheduled in the current week |

### Private Methods

- `getProfitThisMonth()` - Sums payments for the month (filtered by currency) minus the sum of costs for the month. Filters by `BusinessSettings::current()->default_currency`.
- `getPendingPayments()` - Counts and sums pending payments, tracks overdue ones.
- `getActiveProjectsCount()` - Counts projects with `in_progress` status.
- `getOpenTasksCount()` - Counts open tasks (todo + in_progress), breakdown by status including blocked.
- `getMeetingsThisWeekCount()` - Counts meetings scheduled in the current week.

## DashboardListsQuery

Retrieves sorted lists of recent/urgent items. Returns an array with 6 keys:

| Key | Query | Limit |
|-----|-------|-------|
| `tasks_due_soon` | Tasks due within the next 7 days, open status | 5 |
| `upcoming_meetings` | Future scheduled meetings | 5 |
| `overdue_payments` | Pending payments with `due_date < now()` | 5 |
| `recent_payments` | Latest received payments (paid), sorted by `paid_at` desc | 5 |
| `recent_costs` | Latest costs with `paid_at` not null, sorted by `paid_at` desc | 5 |
| `projects_due_soon` | `in_progress` projects with `due_date >= now()`, sorted by deadline | 5 |

### N+1 Optimization

The `hydrateProjects()` method batch-loads all projects referenced in the lists (including `recent_costs`) with eager loading of the `client` relationship, avoiding N+1 queries.

## DashboardChartQuery

Generates data for the annual chart. Returns an array with 4 keys:

| Key | Type | Content |
|-----|------|---------|
| `labels` | `array` | 12 translated month abbreviations (Jan, Feb, ...) |
| `payments` | `array` | Monthly payment totals for the current year |
| `costs` | `array` | Monthly cost totals for the current year |
| `profit` | `array` | Calculated profit (payments - costs) per month |

### Private Methods

- `getCurrentYearMonths()` - Generates a collection of 12 months with keys: `key` (Y-m), `label` (translated month), `start`, `end`.
- `getMonthlyPayments(Collection $months)` - Queries paid payments for the year, filtered by currency from `BusinessSettings::current()->default_currency`, grouped by month with summed amounts.
- `getMonthlyCosts(Collection $months)` - Same logic for costs.

## Currency

All 3 query classes use `BusinessSettings::current()->default_currency` to filter payments and costs by currency. The `BusinessSettings` singleton executes only one query per request thanks to the static cache.

## Technical Notes

- The query classes follow the CQRS pattern: they encapsulate all data reading logic.
- No data is cached at the application level: aggregations are calculated on every request.
- Model scopes (`open()`, `upcoming()`, `overdue()`, `paid()`, `thisYear()`, `thisMonth()`, `thisWeek()`) simplify the queries.
