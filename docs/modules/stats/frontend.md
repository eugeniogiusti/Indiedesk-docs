---
title: Statistics Module Frontend - IndieDesk
sidebar_label: Frontend
description: Financial statistics UI with Chart.js integration, net-of-tax profit, a Tax Fund tracker, PDF export and Blade partials. Period filters, KPI cards and monthly breakdown tables.
keywords: [Chart.js statistics, statistics UI, net profit, tax fund, PDF export, Blade partials, KPI cards, IndieDesk frontend, financial charts, monthly breakdown]
---

# Frontend

The Statistics module (docs folder `stats`) uses Blade views composed of partials, GET filters, and a JS component for the Chart.js chart.

## File Structure

```
resources/views/statistics/
├── index.blade.php
├── _filters.blade.php
├── _summary.blade.php
├── _tax-fund.blade.php
├── _chart.blade.php
├── _monthly-table.blade.php
├── _monthly-detail.blade.php
├── _top-projects.blade.php
└── pdf/
    ├── report.blade.php
    └── partials/
        ├── _styles.blade.php
        ├── _header.blade.php
        ├── _summary.blade.php
        ├── _monthly-table.blade.php
        ├── _monthly-detail.blade.php
        ├── _top-projects.blade.php
        └── _footer.blade.php

resources/js/components/
└── annualTrendChart.js
```

## Frontend Pattern

### Orchestrator View

`statistics/index.blade.php` acts as the orchestrator:
- module header
- period filters
- summary cards
- Tax Fund card
- chart
- monthly breakdown table (annual view only, when `$stats['monthly']` is set)
- top 10 most profitable projects table (annual view only, when `$stats['top_projects']` is set)
- monthly detail tables (single month view only, when `$stats['detail']` is set)

### Main Partials

- **_filters.blade.php**
  - year/month selectors with auto-submit (`onchange="this.form.submit()"`)
  - reset action to annual view
  - PDF download button with same current filter

- **_summary.blade.php**
  - financial KPI cards (`profit`, `payments`, `costs`, `pending`)
  - **Profit card** renders `$stats['summary']['display_profit']` (net of estimated tax when the fiscal rates are configured, gross otherwise — the view never computes the fallback itself, see [`FinancialStatsQuery`](../stats/backend.md#financialstatsquery)). Small breakdown line below the big number: `+payments` (emerald) / `-costs` (red) / `-estimated_tax` (amber, only shown when not null) — same visual pattern as the Dashboard's Profit This Month card
  - operational KPI cards (`projects_started`, `projects_completed`, `tasks_completed`, `meetings_held`, `new_clients`)

- **_tax-fund.blade.php**
  - Tax Fund card: compares the tax savings account balance against the current year's estimated liability (see [`TaxFundService`](../taxes/backend.md#taxfundservice))
  - shows nothing but a "not configured" message when the fiscal rates aren't set
  - otherwise three figures: **Saldo** (balance), **Ancora da accantonare** (remaining due, with a small sub-line showing the raw due/already-paid split when something's already been paid), **Differenza** (surplus in emerald / shortfall in red)
  - inline collapsible form (`x-show`, no modal) to register a manual movement: date, amount, deposit/withdrawal select, optional notes — submits to `tax-fund-movements.store`
  - collapsible list of the 10 most recent movements, each with a delete button — except auto-generated ones (`movement.tax_id` set), which show a 🔗 icon instead and can't be deleted directly (see [Tax Fund auto-sync](../taxes/backend.md#auto-sync-with-the-taxes-module))

- **_chart.blade.php**
  - initializes Alpine `annualTrendChart(...)` passing dataset from backend
  - supports two modes:
    - annual (`monthly`)
    - monthly (`daily`)

- **_monthly-table.blade.php**
  - annual month-by-month breakdown table
  - clickable month link to enter monthly detail
  - Profit column renders `$row['display_profit']` (net of tax when configured); a `title` tooltip on the cell shows the gross/tax breakdown (`$row['profit']` / `$row['estimated_tax']`) when `$row['net_profit']` isn't null — kept as a tooltip rather than visible sub-text to avoid cluttering a 12-row table
  - footer totals also use `$stats['summary']['display_profit']`

- **_top-projects.blade.php**
  - annual view only (when `$stats['top_projects']` is not empty)
  - shows top 10 projects ranked by profit descending
  - columns: rank, project name (link to `projects.show`), client, income, costs, profit
  - profit colored green if positive, red if negative
  - **Deliberately left gross, not netted against estimated tax.** Unlike the page-level Profit card (whole-business total for a period, well-defined), this ranks *individual projects* — a project's share of the cumulative/progressive tax depends on what else happened across every other project that year, so a "net profit per project" figure would be somewhat arbitrary and could even reorder the ranking based on unrelated payment timing elsewhere. Same reasoning applies to the project show page's own Profit tab

- **_monthly-detail.blade.php**
  - single month view only (when `$stats['detail']` is set)
  - two tables side by side: costs and payments for the selected month
  - each row shows date, project/client, type (costs) or amount
  - each payment row also shows a "set aside" line from `$stats['detail']['payment_tax_estimates']`, via the shared `payments.partials.payment-table._row-tax-estimate` partial (`showBreakdown: false` — see [Payments frontend](../payments/frontend.md#shared-tax-estimate-partial))
  - totals and month profit (`display_profit`) from `$stats['summary']` (no logic in the view)

## JS Chart Component

`resources/js/components/annualTrendChart.js`:
- uses Chart.js (bar for payments/costs + line for profit)
- destroys/reinitializes the chart on each render
- listens for theme change (`MutationObserver` on `dark` class) to recalculate colors
- tooltip/Y-axis formatter with `currencySymbol`

Component registration in `resources/js/app.js`:
- `Alpine.data('annualTrendChart', annualTrendChart)`

## PDF Report

Dedicated template in `resources/views/statistics/pdf/*`:
- separate layout for print
- **annual view**: header → summary → monthly breakdown table → top 10 projects table
- **monthly view**: header → summary → monthly detail tables (costs + payments) → month profit
- used exclusively by `StatisticsPdfExporter`
- no logic in views: all values come from `$stats` passed by the service
- summary and monthly-table profit figures use `display_profit`, same as the web page (net of tax when configured) — see the [duplicated-views warning](../stats/backend.md#pdf-service) in the backend docs before adding any new profit-related field

## Internationalization

Statistics frontend strings use:
- `lang/*/statistics.php`

Month labels in filters and datasets use `Carbon::translatedFormat(...)`.

## Dark Mode

The module supports dark mode with `dark:*` classes in the partials.
The chart automatically updates its palette when the theme changes.
