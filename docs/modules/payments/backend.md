---
title: Payments Module Backend - IndieDesk
sidebar_label: Backend
description: Payment tracking, invoice management and per-payment tax estimation in Laravel. CRUD operations, filters, statistics and project income integration patterns.
keywords: [Laravel payments, payment tracking, invoice payments, tax estimation, Laravel billing, payment management, IndieDesk payments, income tracking]
---

# Backend

The Payments module manages project income with a global index (filters + statistics), CRUD within the project context, and invoice integration.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Payments/
│   │   └── PaymentController.php
│   └── Requests/Payments/
│       ├── StorePaymentRequest.php
│       └── UpdatePaymentRequest.php
├── Models/
│   └── Payment.php
└── Queries/Payments/
    ├── PaymentIndexQuery.php
    └── PaymentStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/payments` | index | Global paginated payment list with filters |
| POST | `/projects/{project}/payments` | store | Create payment in the project |
| PUT | `/projects/{project}/payments/{payment}` | update | Update project payment |
| DELETE | `/projects/{project}/payments/{payment}` | destroy | Delete payment |

### Invoice Integration

The invoice flow used by payments goes through dedicated Invoice module routes:

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| POST | `/invoices/payments/{payment}/generate` | invoices.generate | Generate invoice PDF |
| POST | `/invoices/payments/{payment}/upload` | invoices.upload | Upload manual invoice |
| GET | `/invoices/payments/{payment}/download` | invoices.download | Download invoice |
| GET | `/invoices/payments/{payment}/preview` | invoices.preview | Invoice preview |
| DELETE | `/invoices/payments/{payment}` | invoices.destroy | Delete invoice |

## Controller

The `PaymentController` uses the **Query Classes** pattern to separate query/filter logic from the controller.

### Methods

- **index()** - Uses `PaymentIndexQuery` for paginated list and `PaymentStatsQuery` for statistics cards. Also computes `$paymentTaxEstimates = (new PaymentTaxCalculator())->calculateForPayments($payments->getCollection())` — a `Collection<PaymentTaxEstimate>` keyed by payment id, passed to the view for the "set aside" figure on each row (see [Taxes module](../taxes/backend.md#tax-calculation-engine))
- **store()** - Validates with `StorePaymentRequest`, creates payment in the project and redirects to `projects.show?tab=payments`
- **update()** - Validates with `UpdatePaymentRequest`, updates payment and redirects to the payments tab of the project show
- **destroy()** - Deletes payment and returns to the payments tab of the project show

## Model

The `Payment` model is located in `app/Models/Payment.php`.

### Features

- **project relationship** - each payment belongs to a project
- **Domain constants** - `METHODS` and `CURRENCIES`
- **Scopes** - `method()`, `currency()`, `forProject()`, `paid()`, `pending()`, `overdue()`, `thisMonth()`, `thisYear()`, `dateRange()`
- **Status helpers** - `isPaid()`, `isPending()`, `isOverdue()`
- **Amount helpers** - `getFormattedAmount()`, `getCompactAmount()`
- **Invoice helpers** - `hasInvoice()`, download/preview URLs
- **CalendarEventable** - calendar event support when `paid_at` or `due_date` is present (uses `paid_at` if collected, falls back to `due_date` for pending payments). Also [syncs automatically](../calendar/backend.md#automatic-sync) on create/update/delete via the nullable `google_event_id` column
- **toFormPayload()** - safe edit payload (`id` + editable fields)
- **Delete hook** - removes local invoice file when payment is deleted

### Payment Methods

| Method | Description |
|--------|-------------|
| `cash` | Cash |
| `bank` | Bank transfer |
| `stripe` | Stripe |
| `paypal` | PayPal |

## Form Requests

Validation handled by:

- **StorePaymentRequest** - payment creation
- **UpdatePaymentRequest** - payment update

### Required Fields

- `amount` - amount (`min:0.01`)
- `currency` - currency (auto-merged from `BusinessSettings::default_currency`)

### Conditional Fields

- `due_date` required when `paid_at` is empty (`required_without:paid_at`)
- `method` required when `paid_at` is present (`required_with:paid_at`)

### Optional Fields

- `paid_at` - collection date
- `reference` - payment reference
- `notes` - notes

Note: in `prepareForValidation()` if `paid_at` is missing, `method = null` is forced.

## Query Classes

The module uses the **Query Classes** pattern to keep query logic out of the controller.

### PaymentIndexQuery

Manages the global payment list with:
- pagination (15)
- eager loading `project.client`
- filters `project_id`, `method`, `currency`, `date_from`, `date_to`
- search on `reference`, `notes`, project name
- sorting by `paid_at desc`

### PaymentStatsQuery

Calculates statistics for index cards using only collected payments (`paid_at` not null):
- `total_all_time`
- `total_this_month`
- `total_this_year`
- `estimated_tax_this_month` / `estimated_tax_this_year` — INPS + imposta sostitutiva estimated on the period's payments via `PaymentTaxCalculator`, null if the fiscal rates aren't configured

**No estimated tax on `total_all_time`.** The calculation always uses *today's* configured rates — applying them retroactively across multiple fiscal years (which may well have had different rates) would misrepresent history, so the "Total All Time" card shows an explanatory note instead of a number. `estimated_tax_this_month`/`_this_year` don't have this problem since they're always within the current year.
