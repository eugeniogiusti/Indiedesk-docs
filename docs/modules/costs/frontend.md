# Frontend

The Costs module uses the **Partial Views** pattern to keep the global index and costs section in the project show modular and reusable.

## File Structure

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

## Frontend Pattern

### Orchestrator Views

The `costs/index.blade.php` view acts as an orchestrator:
- includes header, statistics, filters
- chooses table or empty-state based on results

### Reusable Partials

The module separates the two UI contexts:
- **Global costs index**: partials in `costs/index/*`
- **Costs tab of the project show**: partials in `costs/partials/*`

`costs/partials/_cost-table.blade.php` is used in the project show (`projects/show/_tab-costs.blade.php`).

## Modal (Alpine.js)

### Cost Modal

Managed in:
- view: `costs/partials/_modal-form.blade.php`
- component: `resources/js/components/costModal.js`

Flow:
- open create with `open-cost-modal` event
- open edit with `edit-cost` event (record payload)
- submit to route `costs.store` / `costs.update`

The component manages `open`, `isEdit`, `costId`, and `formData` state.

### Upload Receipt Modal

Managed in:
- view: `costs/partials/_upload-receipt-modal.blade.php`
- component: `resources/js/components/receiptUploadModal.js`

Flow:
- open with `upload-receipt` event (passes `costId`)
- dynamic `uploadUrl` construction (`/projects/{projectId}/costs/{costId}/receipt`)
- receipt file upload

## Cost Table Actions (project show)

In `costs/partials/cost-table/_row-receipt.blade.php` the following are available:
- receipt preview
- receipt download
- receipt delete
- receipt upload

Actions use `receipts.*` routes.

In `costs/partials/cost-table/_row-actions.blade.php` the following are available:
- edit cost (`edit-cost` event with payload from `toFormPayload()`)
- delete cost (`costs.destroy`)

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `window.costModal = costModal`
- `window.receiptUploadModal = receiptUploadModal`

The global `data-action` listener in `app.js` dispatches the custom events used by the modals.

## Internationalization

Costs frontend strings use:
- `lang/*/costs.php`
- `lang/*/receipts.php`
- `lang/*/ui.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
