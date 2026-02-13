---
title: Statistics Module Frontend - IndieDesk
sidebar_label: Frontend
description: Financial statistics UI with Chart.js integration, PDF export and Blade partials. Period filters, KPI cards and monthly breakdown tables.
keywords: [Chart.js statistics, statistics UI, PDF export, Blade partials, KPI cards, IndieDesk frontend, financial charts, monthly breakdown]
---

# Frontend

The Statistics module (docs folder `stats`) uses Blade views composed of partials, GET filters, and a JS component for the Chart.js chart.

## File Structure

```
resources/views/statistics/
├── index.blade.php
├── _filters.blade.php
├── _summary.blade.php
├── _chart.blade.php
├── _monthly-table.blade.php
└── pdf/
    ├── report.blade.php
    └── partials/
        ├── _styles.blade.php
        ├── _header.blade.php
        ├── _summary.blade.php
        ├── _monthly-table.blade.php
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
- chart
- monthly table (only when present)

### Main Partials

- **_filters.blade.php**
  - year/month selectors with auto-submit (`onchange="this.form.submit()"`)
  - reset action to annual view
  - PDF download button with same current filter

- **_summary.blade.php**
  - financial KPI cards (`profit`, `payments`, `costs`, `pending`)
  - operational KPI cards (`projects_started`, `projects_completed`, `tasks_completed`, `meetings_held`, `new_clients`)

- **_chart.blade.php**
  - initializes Alpine `annualTrendChart(...)` passing dataset from backend
  - supports two modes:
    - annual (`monthly`)
    - monthly (`daily`)

- **_monthly-table.blade.php**
  - annual month-by-month breakdown table
  - clickable month link to enter monthly detail
  - footer with totals

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
- includes header, summary, and monthly table
- used exclusively by `StatisticsPdfExporter`

## Internationalization

Statistics frontend strings use:
- `lang/*/statistics.php`

Month labels in filters and datasets use `Carbon::translatedFormat(...)`.

## Dark Mode

The module supports dark mode with `dark:*` classes in the partials.
The chart automatically updates its palette when the theme changes.
