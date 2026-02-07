# Frontend

Il modulo Payments usa il pattern **Partial Views** per mantenere index globale e sezione pagamenti nella show progetto modulari e riusabili.

## Struttura File

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

## Pattern Frontend

### Orchestrator Views

La vista `payments/index.blade.php` funziona da orchestrator:
- include header, statistiche, filtri
- sceglie table o empty-state in base ai risultati

### Partial riusabili

Il modulo separa i due contesti UI:
- **Index globale pagamenti**: partial in `payments/index/*`
- **Tab pagamenti della show progetto**: partial in `payments/partials/*`

`payments/partials/_payment-table.blade.php` è la tabella riusabile usata nella show progetto.

## Modal (Alpine.js)

### Payment Modal

Gestito in:
- view: `payments/partials/_modal-form.blade.php`
- componente: `resources/js/components/paymentModal.js`

Flusso:
- apertura create con evento `open-payment-modal`
- apertura edit con evento `edit-payment` (payload record)
- submit su route `payments.store` / `payments.update`

Il form è condizionale su stato incassato/non incassato (`is_paid`):
- se incassato richiede `paid_at` + `method`
- se non incassato richiede `due_date`

### Upload Invoice Modal

Gestito in:
- view: `payments/partials/_upload-invoice-modal.blade.php`
- componente: `resources/js/components/uploadInvoiceModal.js`

Flusso:
- apertura con evento `open-upload-modal` (passa payment id)
- costruzione dinamica `uploadUrl` (`/invoices/payments/{id}/upload`)
- upload file PDF

## Azioni tabella pagamenti (show progetto)

In `payments/partials/payment-table/_row-invoice.blade.php` sono disponibili:
- preview fattura
- download fattura
- delete fattura
- generate fattura PDF
- upload fattura manuale

Le azioni usano route `invoices.*` e, per upload, aprono il modal dedicato.

## Wiring JS globale

Registrazione componenti in `resources/js/app.js`:
- `window.paymentModal = paymentModal`
- `window.uploadInvoiceModal = uploadInvoiceModal`

Il listener globale `data-action` in `app.js` dispatcha gli eventi custom usati dai modal.

## Internazionalizzazione

Le stringhe frontend payments usano:
- `lang/*/payments.php`
- `lang/*/invoices.php`

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*`, coerente con il layout applicativo.
