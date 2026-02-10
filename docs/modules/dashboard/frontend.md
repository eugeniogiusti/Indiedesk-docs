# Frontend

The dashboard is composed of a main view that includes 4 sections via partials: stat cards, annual chart, welcome card, and quick lists.

## File Structure

```
resources/views/dashboard/
├── index.blade.php
├── _stats-cards.blade.php
├── _chart.blade.php
├── _welcome-card.blade.php
├── _lists.blade.php
├── stats-cards/
│   ├── _profit.blade.php
│   ├── _pending-payments.blade.php
│   ├── _active-projects.blade.php
│   └── _open-tasks.blade.php
└── lists/
    ├── _tasks-due-soon.blade.php
    ├── _upcoming-meetings.blade.php
    ├── _overdue-payments.blade.php
    └── _recent-payments.blade.php

resources/js/components/
└── annualTrendChart.js
```

## Page Layout (`index.blade.php`)

Uses `<x-app-layout>`. Grid structure:

1. **Header** - Page title and current date
2. **Stats cards** - Row of 4 KPI cards (`_stats-cards.blade.php`)
3. **2-column grid** - Chart (2/3 width) + Welcome card (1/3 width)
4. **Quick lists** - 2x2 grid with 4 lists (`_lists.blade.php`)

## Stat Cards

`_stats-cards.blade.php` includes 4 cards from the `stats-cards/` subfolder:

### Profit This Month (`_profit.blade.php`)
- **Data**: `$stats['profit_this_month']['amount']`
- Dynamic color: green (emerald) if positive, red if negative
- Breakdown: `+payments`, `-costs`

### Pending Payments (`_pending-payments.blade.php`)
- **Data**: `$stats['pending_payments']['total']` (amount in currency)
- Shows count and total amount to collect
- Orange warning if there are overdue payments

### Active Projects (`_active-projects.blade.php`)
- **Data**: `$stats['active_projects']` (count)
- Number of projects in progress
- Blue color

### Open Tasks (`_open-tasks.blade.php`)
- **Data**: `$stats['open_tasks']` (array with breakdown)
- Total + breakdown by status: todo (gray), in_progress (blue), blocked (red)
- Purple color

## Annual Chart (`_chart.blade.php`)

Mixed bar+line chart showing the annual financial trend.

### Data Passed to Alpine.js Component

```html
<div x-data="annualTrendChart(@js([...]))">
```

| Data | Description |
|------|-------------|
| `labels` | Month abbreviations |
| `payments` | Array of 12 monthly payment totals |
| `costs` | Array of 12 monthly cost totals |
| `profit` | Array of 12 calculated profit |
| `currencySymbol` | Currency symbol from BusinessSettings |
| `translations` | Translated labels for legend |

### JS Component (`annualTrendChart.js`)

Alpine.js component registered in `app.js` that uses Chart.js:

- **Type**: Mixed - bars (payments/costs) + line (profit)
- **Colors**: Payments emerald, costs red, profit indigo
- **Dark mode**: Automatically detects via `MutationObserver` on the `dark` class of `<html>`, regenerates the chart when it changes
- **Tooltip**: Currency formatting with `it-IT` locale
- **Y axis**: Starts at zero, currency symbol prefix on ticks

Registration in `app.js`:
```javascript
import annualTrendChart from './components/annualTrendChart';
Alpine.data('annualTrendChart', annualTrendChart);
```

## Welcome Card (`_welcome-card.blade.php`)

Static informational card with:
- Application logo
- Title and subtitle
- List of 4 features: client management (blue), projects (green), payments (amber), documentation (purple)

## Quick Lists (`_lists.blade.php`)

`_lists.blade.php` includes 4 lists from the `lists/` subfolder, arranged in a 2x2 grid:

### Tasks Due Soon (`_tasks-due-soon.blade.php`)
- **Data**: `$lists['tasks_due_soon']` (max 5)
- Shows: task title, project name, due date
- Colored dot for status: red (overdue), blue (in progress), gray (todo)
- "View all" link → `route('tasks.index')`

### Upcoming Meetings (`_upcoming-meetings.blade.php`)
- **Data**: `$lists['upcoming_meetings']` (max 5)
- Shows: date (large day + small month), title, project, time (H:i)
- "View all" link → `route('meetings.index')`

### Overdue Payments (`_overdue-payments.blade.php`)
- **Data**: `$lists['overdue_payments']` (max 5)
- Shows: amount + currency, client/project
- Red warning: days overdue
- "View all" link → `route('payments.index')`

### Recent Payments (`_recent-payments.blade.php`)
- **Data**: `$lists['recent_payments']` (max 5)
- Shows: amount (green with +), project name, payment date
- Green checkmark icon
- "View all" link → `route('payments.index')`

### Empty State

Each list has a dedicated empty state message when there are no items.

## Currency

The currency symbol (`$currencySymbol`) and code (`$currencyCode`) are globally injected into all views via the View Composer in `AppServiceProvider`. The stat cards and lists use them to format amounts.

## Technical Notes

- No Livewire components: all server-side rendering with Blade + Alpine.js only for the chart.
- Dark mode supported on all components via Tailwind `dark:` classes.
- Lists link to the respective module index pages for further details.
- The chart is the only component that requires JavaScript (Chart.js + Alpine.js).
