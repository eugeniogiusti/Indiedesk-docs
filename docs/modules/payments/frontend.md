---
title: Payments Module Frontend - IndieDesk
sidebar_label: Frontend
description: Payment tracking UI with Alpine.js modals, invoice integration, per-payment tax estimates and Blade partials. Filters, stats cards and reusable table components.
keywords: [Alpine.js payments, payment UI, invoice integration, tax estimate, Blade partials, modal forms, IndieDesk frontend, payment tracking UI, table filters]
---

# Frontend

The Payments module uses the **Partial Views** pattern to keep the global index and payments section in the project show modular and reusable.

## File Structure

```
resources/views/payments/
├── index.blade.php
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _method.blade.php
│   │   ├── _currency.blade.php
│   │   ├── _date-range.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _total-all-time.blade.php
│   │   ├── _this-month.blade.php
│   │   ├── _this-year.blade.php
│   │   └── _by-currency.blade.php
│   └── payment-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-amount.blade.php
│       ├── _row-method.blade.php
│       ├── _row-paid-at.blade.php
│       ├── _row-reference.blade.php
│       ├── _row-invoice.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _payment-table.blade.php
    ├── _modal-form.blade.php
    ├── _form-fields.blade.php
    ├── _upload-invoice-modal.blade.php
    └── payment-table/
        ├── _header.blade.php
        ├── _row.blade.php
        ├── _row-amount.blade.php
        ├── _row-tax-estimate.blade.php
        ├── _row-method.blade.php
        ├── _row-paid-at.blade.php
        ├── _row-reference.blade.php
        ├── _row-invoice.blade.php
        └── _row-actions.blade.php

resources/js/components/
├── paymentModal.js
└── uploadInvoiceModal.js
```

## Frontend Pattern

### Orchestrator Views

The `payments/index.blade.php` view acts as an orchestrator:
- includes header, statistics, filters
- chooses table or empty-state based on results

### Reusable Partials

The module separates the two UI contexts:
- **Global payments index**: partials in `payments/index/*`
- **Payments tab of the project show**: partials in `payments/partials/*`

`payments/partials/_payment-table.blade.php` is the reusable table used in the project show.

### Shared Tax Estimate Partial

`payments/partials/payment-table/_row-tax-estimate.blade.php` is a single physical file `@include`d from **both** row trees (`index/payment-table/_row-amount.blade.php` and `partials/payment-table/_row-amount.blade.php`), plus from the client show and Statistics monthly-detail payment rows. It renders inline inside the Importo/Amount cell (not its own table column — that was the first design, changed after review), given `payment` and `taxEstimate` (a `?PaymentTaxEstimate`, see [Taxes module](../taxes/backend.md#paymenttaxestimate-dto)):

- shows nothing when `$taxEstimate` is null (rates not configured, or the payment isn't paid yet)
- otherwise: `{{ __('payments.set_aside') }}: {{ setAsideAmount }}`, formatted via `$payment->formatCurrency()` (not inline `number_format`)
- accepts an optional `showBreakdown` param (default `true`): when `true`, adds a parenthetical `(INPS €x · Tasse €y)`. Set to `false` on the global payments index and the Statistics monthly-detail table — dense, many-row listings — to keep rows compact; left `true` (default) on the project show tab and client show, which show fewer rows

Because the logic lives in one file, any future change to how the estimate is displayed only needs to happen once.

### Stat Cards: Estimated Tax

`index/stats-cards/_this-month.blade.php` and `_this-year.blade.php` each show a small "Tasse stimate" line below the total (from `PaymentStatsQuery`'s `estimated_tax_this_month`/`_this_year`, hidden if null). `_total-all-time.blade.php` instead shows an explanatory note (no figure) — see the backend docs for why an all-time estimate isn't computed.

## Modal (Alpine.js)

### Payment Modal

Managed in:
- view: `payments/partials/_modal-form.blade.php`
- component: `resources/js/components/paymentModal.js`

Flow:
- open create with `open-payment-modal` event
- open edit with `edit-payment` event (record payload)
- submit to route `payments.store` / `payments.update`

The form is conditional on paid/unpaid state (`is_paid`):
- if paid, requires `paid_at` + `method`
- if not paid, requires `due_date`

### Upload Invoice Modal

Managed in:
- view: `payments/partials/_upload-invoice-modal.blade.php`
- component: `resources/js/components/uploadInvoiceModal.js`

Flow:
- open with `open-upload-modal` event (passes payment id)
- dynamic `uploadUrl` construction (`/invoices/payments/{id}/upload`)
- PDF file upload

## Payment Table Actions (project show)

Row actions in `payments/partials/payment-table/_row-actions.blade.php` are stacked vertically and include:

- **Google Calendar** — visible when `paid_at` or `due_date` is present. Uses `paid_at` for collected payments, `due_date` for pending ones.
- **Billing Tool** — visible only if `billing_tool_url` is set in Business Settings. Opens the configured billing tool in a new tab. The URL is injected via the global View Composer in `AppServiceProvider` as `$billingToolUrl`.
- **Edit** — opens the payment edit modal
- **Delete** — deletes the payment with confirmation

Invoice actions in `payments/partials/payment-table/_row-invoice.blade.php`:
- invoice preview
- invoice download
- invoice delete
- generate invoice PDF
- manual invoice upload

Actions use `invoices.*` routes and, for upload, open the dedicated modal.

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `window.paymentModal = paymentModal`
- `window.uploadInvoiceModal = uploadInvoiceModal`

The global `data-action` listener in `app.js` dispatches the custom events used by the modals.

## Internationalization

Payments frontend strings use:
- `lang/*/payments.php`
- `lang/*/invoices.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
