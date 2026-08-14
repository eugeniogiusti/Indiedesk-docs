---
title: Statistics Module Backend - IndieDesk
sidebar_label: Backend
description: Financial and operational analytics in Laravel, including net-of-tax profit and the Tax Fund tracker. Charts, metrics by period, PDF export and query orchestrator patterns.
keywords: [Laravel statistics, dashboard charts, Laravel analytics, financial metrics, net profit, tax fund, IndieDesk stats, operational analytics, PDF export]
---

# Backend

The Statistics module manages financial and operational metrics by period, chart trends, and PDF export.

## File Structure

```
app/
├── Http/
│   └── Controllers/Statistics/
│       └── StatisticsController.php
├── Queries/Statistics/
│   ├── StatisticsQuery.php
│   └── SubQueries/
│       ├── FinancialStatsQuery.php
│       ├── OperationalStatsQuery.php
│       ├── ChartDataQuery.php
│       ├── MonthlyBreakdownQuery.php
│       ├── MonthlyDetailQuery.php
│       └── TopProjectsQuery.php
└── Services/Statistics/
    └── StatisticsPdfExporter.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/statistics` | index | Statistics dashboard by year/month |
| GET | `/statistics/export-pdf` | export-pdf | PDF export of the current report |

## Controller

`StatisticsController` coordinates period input, aggregated query, and export.

### Methods

- **index()** - resolves `year`/`month`, calculates `availableYears`, invokes `StatisticsQuery`, builds the `$taxFund` array (`balance`, `due`, `paid`, `remaining`, `difference`, `movements`) via `TaxFundService` (injected) + `TaxFundMovement::latest()->take(10)`, and renders `statistics.index`. `$taxFund` always reflects the real current year, independent of the `year`/`month` filter — see [`TaxFundService`](../taxes/backend.md#taxfundservice)
- **exportPdf()** - uses `StatisticsPdfExporter` to generate and download the PDF report
- **getAvailableYears()** - builds the list of available years (from the current year up to 2026)

## Query Orchestrator

`StatisticsQuery` is the query orchestrator:
- calculates the period range (`startDate`, `endDate`) based on year/month
- composes a single output:
  - `summary` (financial + operational)
  - `monthly` (month-by-month breakdown, annual view only)
  - `detail` (per-row costs and payments, single month view only)
  - `top_projects` (top 10 most profitable projects, annual view only)
  - `chart` (monthly or daily chart dataset)

## SubQueries

### FinancialStatsQuery

Calculates financial KPIs for the selected period, filtered by the default currency from `BusinessSettings::current()->default_currency`:
- `payments` (paid income)
- `costs`
- `profit` (`payments - costs`, gross)
- `estimated_tax` — INPS + imposta sostitutiva estimated on the period's paid payments via `PaymentTaxCalculator` (see [Taxes module](../taxes/backend.md#tax-calculation-engine)), **null if the fiscal rates aren't configured**
- `net_profit` — `profit - estimated_tax`, null when `estimated_tax` is null
- `display_profit` — `net_profit ?? profit`. **Views should always render this key**, never fall back to `net_profit ?? profit` themselves — that logic lives here once, not duplicated across every Blade view/PDF partial that shows a profit figure
- `pending` (uncollected payments)

Implementation notes:
- uses dates on `paid_at` for income/costs
- `pending` uses `project.created_at` within the selected range

### OperationalStatsQuery

Calculates operational KPIs for the period:
- `projects_started`
- `projects_completed`
- `tasks_completed`
- `meetings_held`
- `new_clients`

### ChartDataQuery

Prepares the chart dataset:
- **annual view**: monthly series (`type=monthly`)
- **single month view**: daily series (`type=daily`)

Output:
- `labels`
- `payments`
- `costs`
- `profit`

Implementation notes:
- SQL aggregations with `strftime` (SQLite-friendly)
- filters paid payments + default currency from `BusinessSettings`

### MonthlyDetailQuery

Loads the per-row detail of costs and payments for a single month (active only in single month view). Filters by default currency from `BusinessSettings`. Eager loads `project.client`.

Returns:
- `costs` — `Collection` of `Cost` with `project.client`, ordered by `paid_at`
- `payments` — `Collection` of `Payment` (paid only) with `project.client`, ordered by `paid_at`
- `payment_tax_estimates` — `Collection<PaymentTaxEstimate>` keyed by payment id, from `PaymentTaxCalculator::calculateForPayments($payments)`, used to show "set aside" per payment row

Projects without a client are shown as "Internal" in the view.

### TopProjectsQuery

Returns the top 10 most profitable projects for the selected year (annual view only). Filters by default currency from `BusinessSettings`.

For each project aggregates:
- `income` — sum of paid payments (`Payment::paid()`)
- `costs` — sum of costs
- `profit` — `income - costs`

Returns a `Collection` of 10 arrays sorted by `profit` descending, each containing `project` (with eager-loaded `client`), `income`, `costs`, `profit`.

Implementation: two separate `selectRaw` queries with `SUM(amount) GROUP BY project_id`, merged by project ID, then sorted and sliced in PHP to avoid a complex SQL join.

### MonthlyBreakdownQuery

Builds the annual month-by-month table, filtering financial data by the default currency from `BusinessSettings`:
- `payments`, `costs`, `profit` (filtered by currency)
- `estimated_tax`, `net_profit`, `display_profit` — same semantics as `FinancialStatsQuery` (see above), computed per month
- `projects`, `tasks`, `clients` (absolute counts)

Returns a `Collection` with 12 normalized rows (months without data are included).

`estimated_tax` per month is built once via `getEstimatedTaxByMonth()`: fetches **all** paid payments of the year in a single query (not per-month), runs them through `PaymentTaxCalculator::calculateForPayments()` once (so the progressive/cumulative calculation stays correct across month boundaries), then groups the resulting per-payment quotas by `paid_at`'s `Y-m`. Returns `null` (not an empty collection) when the fiscal rates aren't configured, so callers can distinguish "no estimate possible" from "zero tax this month".

## PDF Service

`StatisticsPdfExporter` encapsulates the export:
- uses `StatisticsQuery` for the same data as the web page (includes `detail` when a month is selected)
- in single month view, PDF includes two detail tables (costs + payments) followed by the month profit from `$stats['summary']['display_profit']`
- resolves the currency symbol from `BusinessSettings::default_currency` (fallback `EUR`)
- generates PDF via `barryvdh/laravel-dompdf`
- dynamic filename based on period (`Title-YYYY.pdf` or `Title-YYYY-MM.pdf`)

:::caution Web and PDF profit views are separate Blade files
`resources/views/statistics/pdf/partials/*` is a **parallel, duplicated** set of views, not a re-render of the web partials (DomPDF needs its own inline-CSS-friendly markup). `_monthly-table.blade.php` and `_monthly-detail.blade.php` exist once under `statistics/` (web) and once under `statistics/pdf/partials/` (PDF) — any field added to `FinancialStatsQuery` / `MonthlyBreakdownQuery` / `MonthlyDetailQuery` (e.g. `display_profit`, `estimated_tax`) must be wired into **both** copies, or the PDF silently keeps showing the old (gross) figure while the web page shows the updated one. This exact gap happened when `display_profit` was introduced and initially only updated on the web side.
:::

## Technical Notes

- Statistics queries are centralized in dedicated classes (Query Classes + orchestrator pattern).
- All financial queries read the currency from `BusinessSettings::current()->default_currency` (single source of truth).
- The PDF exposes the currency symbol via the `BusinessSettings::CURRENCIES` constant.
