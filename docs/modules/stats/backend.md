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
│       └── MonthlyBreakdownQuery.php
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

- **index()** - resolves `year`/`month`, calculates `availableYears`, invokes `StatisticsQuery`, and renders `statistics.index`
- **exportPdf()** - uses `StatisticsPdfExporter` to generate and download the PDF report
- **getAvailableYears()** - builds the list of available years (from the current year up to 2026)

## Query Orchestrator

`StatisticsQuery` is the query orchestrator:
- calculates the period range (`startDate`, `endDate`) based on year/month
- composes a single output:
  - `summary` (financial + operational)
  - `monthly` (month-by-month breakdown, annual view only)
  - `chart` (monthly or daily chart dataset)

## SubQueries

### FinancialStatsQuery

Calculates financial KPIs for the selected period, filtered by the default currency from `BusinessSettings::current()->default_currency`:
- `payments` (paid income)
- `costs`
- `profit` (`payments - costs`)
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

### MonthlyBreakdownQuery

Builds the annual month-by-month table, filtering financial data by the default currency from `BusinessSettings`:
- `payments`, `costs`, `profit` (filtered by currency)
- `projects`, `tasks`, `clients` (absolute counts)

Returns a `Collection` with 12 normalized rows (months without data are included).

## PDF Service

`StatisticsPdfExporter` encapsulates the export:
- uses `StatisticsQuery` for the same data as the web page
- resolves the currency symbol from `BusinessSettings::default_currency` (fallback `EUR`)
- generates PDF via `barryvdh/laravel-dompdf`
- dynamic filename based on period (`Title-YYYY.pdf` or `Title-YYYY-MM.pdf`)

## Technical Notes

- Statistics queries are centralized in dedicated classes (Query Classes + orchestrator pattern).
- All financial queries read the currency from `BusinessSettings::current()->default_currency` (single source of truth).
- The PDF exposes the currency symbol via the `BusinessSettings::CURRENCIES` constant.
