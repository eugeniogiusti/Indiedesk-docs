# Frontend

Il modulo Costs usa il pattern **Partial Views** per mantenere index globale e sezione costi nella show progetto modulari e riusabili.

## Struttura File

```
resources/views/costs/
├── index.blade.php
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _type.blade.php
│   │   ├── _currency.blade.php
│   │   ├── _recurring.blade.php
│   │   ├── _date-range.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _total-all-time.blade.php
│   │   ├── _this-month.blade.php
│   │   ├── _this-year.blade.php
│   │   └── _recurring-monthly.blade.php
│   └── cost-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-amount.blade.php
│       ├── _row-type.blade.php
│       ├── _row-recurring.blade.php
│       ├── _row-paid-at.blade.php
│       ├── _row-receipt.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _cost-table.blade.php
    ├── _modal-form.blade.php
    ├── _form-fields.blade.php
    ├── _upload-receipt-modal.blade.php
    └── cost-table/
        ├── _header.blade.php
        ├── _row.blade.php
        ├── _row-amount.blade.php
        ├── _row-type.blade.php
        ├── _row-recurring.blade.php
        ├── _row-paid-at.blade.php
        ├── _row-receipt.blade.php
        └── _row-actions.blade.php

resources/js/components/
├── costModal.js
└── receiptUploadModal.js
```

## Pattern Frontend

### Orchestrator Views

La vista `costs/index.blade.php` funziona da orchestrator:
- include header, statistiche, filtri
- sceglie table o empty-state in base ai risultati

### Partial riusabili

Il modulo separa i due contesti UI:
- **Index globale costi**: partial in `costs/index/*`
- **Tab costi della show progetto**: partial in `costs/partials/*`

`costs/partials/_cost-table.blade.php` e usata nella show progetto (`projects/show/_tab-costs.blade.php`).

## Modal (Alpine.js)

### Cost Modal

Gestito in:
- view: `costs/partials/_modal-form.blade.php`
- componente: `resources/js/components/costModal.js`

Flusso:
- apertura create con evento `open-cost-modal`
- apertura edit con evento `edit-cost` (payload record)
- submit su route `costs.store` / `costs.update`

Il componente gestisce stato `open`, `isEdit`, `costId` e `formData`.

### Upload Receipt Modal

Gestito in:
- view: `costs/partials/_upload-receipt-modal.blade.php`
- componente: `resources/js/components/receiptUploadModal.js`

Flusso:
- apertura con evento `upload-receipt` (passa `costId`)
- costruzione dinamica `uploadUrl` (`/projects/{projectId}/costs/{costId}/receipt`)
- upload file ricevuta

## Azioni tabella costi (show progetto)

In `costs/partials/cost-table/_row-receipt.blade.php` sono disponibili:
- preview ricevuta
- download ricevuta
- delete ricevuta
- upload ricevuta

Le azioni usano route `receipts.*`.

In `costs/partials/cost-table/_row-actions.blade.php` sono disponibili:
- edit costo (evento `edit-cost` con payload da `toFormPayload()`)
- delete costo (`costs.destroy`)

## Wiring JS globale

Registrazione componenti in `resources/js/app.js`:
- `window.costModal = costModal`
- `window.receiptUploadModal = receiptUploadModal`

Il listener globale `data-action` in `app.js` dispatcha gli eventi custom usati dai modal.

## Internazionalizzazione

Le stringhe frontend costs usano:
- `lang/*/costs.php`
- `lang/*/receipts.php`
- `lang/*/ui.php`

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*`, coerente con il layout applicativo.
