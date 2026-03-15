---
title: Costs Module Backend - IndieDesk
sidebar_label: Backend
description: Expense tracking and cost management in Laravel. Recurring costs, receipt integration, filters and project cost analysis patterns.
keywords: [Laravel costs, expense tracking, cost management, project costs, recurring expenses, IndieDesk costs, expense receipts]
---

# Backend

The Costs module manages project costs with a global index (filters + statistics), CRUD within the project context, and receipt integration.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Costs/
│   │   └── CostController.php
│   └── Requests/Costs/
│       ├── StoreCostRequest.php
│       └── UpdateCostRequest.php
├── Models/
│   └── Cost.php
└── Queries/Costs/
    ├── CostIndexQuery.php
    └── CostStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/costs` | index | Global paginated cost list with filters |
| POST | `/projects/{project}/costs` | store | Create cost in the project |
| PUT | `/projects/{project}/costs/{cost}` | update | Update project cost |
| DELETE | `/projects/{project}/costs/{cost}` | destroy | Delete cost |

### Receipt Integration

Cost receipts go through dedicated Receipt module routes:

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| POST | `/projects/{project}/costs/{cost}/receipt` | receipts.upload | Upload receipt |
| GET | `/projects/{project}/costs/{cost}/receipt/download` | receipts.download | Download receipt |
| GET | `/projects/{project}/costs/{cost}/receipt/preview` | receipts.preview | Receipt preview |
| DELETE | `/projects/{project}/costs/{cost}/receipt` | receipts.destroy | Delete receipt |

## Controller

The `CostController` uses the **Query Classes** pattern to separate query/filter logic from the controller.

### Methods

- **index()** - Uses `CostIndexQuery` for paginated list and `CostStatsQuery` for statistics cards
- **store()** - Validates with `StoreCostRequest`, creates cost in the project and redirects to `projects.show?tab=costs`
- **update()** - Validates with `UpdateCostRequest`, updates cost and redirects to the costs tab of the project show
- **destroy()** - Deletes cost and returns to the costs tab of the project show

## Model

The `Cost` model is located in `app/Models/Cost.php`.

### Features

- **project relationship** - each cost belongs to a project
- **Domain constants** - `TYPES`, `CURRENCIES`, `RECURRING_PERIODS`
- **Scopes** - `type()`, `currency()`, `recurring()`, `forProject()`, `thisMonth()`, `thisYear()`, `dateRange()`
- **Status/format helpers** - `isRecent()`, `getCurrencySymbol()`, `getFormattedAmount()`
- **Receipt helpers** - `hasReceipt()`, upload/download/preview/delete URLs
- **toFormPayload()** - safe edit payload (`id` + editable fields)
- **Delete hook** - removes local receipt file when cost is deleted

### Cost Types

| Type | Description |
|------|-------------|
| `hosting` | Hosting expenses |
| `api` | API costs |
| `tool` | SaaS tools/services |
| `license` | Licenses |
| `ads` | Advertising |
| `service` | External services |
| `travel` | Transport/Travel (travel, commute, transit subscriptions) |

### Recurrence Periods

| Value | Description |
|-------|-------------|
| `monthly` | Monthly |
| `quarterly` | Quarterly |
| `yearly` | Yearly |

## Form Requests

Validation handled by:

- **StoreCostRequest** - cost creation
- **UpdateCostRequest** - cost update

### Required Fields

- `amount` - amount (`min:0.01`)
- `type` - cost type (`Rule::in(Cost::TYPES)`)
- `paid_at` - payment date
- `currency` - currency (auto-merged from `BusinessSettings::default_currency`)

### Conditional Fields

- `recurring_period` required when `recurring=1` (`required_if:recurring,1`)

### Optional Fields

- `recurring` - recurring cost flag
- `receipt_path` - receipt path
- `notes` - notes

## Query Classes

The module uses the **Query Classes** pattern to keep query logic out of the controller.

### CostIndexQuery

Manages the global cost list with:
- pagination (15)
- eager loading `project.client`
- filters `project_id`, `type`, `currency`, `recurring`, `date_from`, `date_to`
- search on `notes` and project name
- sorting by `paid_at desc`

### CostStatsQuery

Calculates statistics for index cards filtered by the default currency from `BusinessSettings::current()->default_currency`:
- `total_all_time` - total costs in the default currency
- `total_this_month` - current month total
- `total_this_year` - current year total
- `recurring_monthly` - monthly recurring costs only
