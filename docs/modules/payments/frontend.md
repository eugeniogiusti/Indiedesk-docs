---
title: Payments Module Frontend - IndieDesk
sidebar_label: Frontend
description: Payment tracking UI with Alpine.js modals, invoice integration and Blade partials. Filters, stats cards and reusable table components.
keywords: [Alpine.js payments, payment UI, invoice integration, Blade partials, modal forms, IndieDesk frontend, payment tracking UI, table filters]
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

In `payments/partials/payment-table/_row-invoice.blade.php` the following are available:
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
