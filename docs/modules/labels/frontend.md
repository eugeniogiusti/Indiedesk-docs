# Frontend

The Labels module uses a single management page with Blade partials and an Alpine modal for create/edit.

## File Structure

```
resources/views/labels/
├── index.blade.php
└── partials/
    ├── _header.blade.php
    ├── _table.blade.php
    ├── _empty-state.blade.php
    ├── _modal-form.blade.php
    ├── label-table/
    │   ├── _header.blade.php
    │   ├── _row.blade.php
    │   ├── _row-name.blade.php
    │   ├── _row-color.blade.php
    │   ├── _row-documents-count.blade.php
    │   └── _row-actions.blade.php
    └── modal-form/
        ├── _backdrop.blade.php
        ├── _header.blade.php
        ├── _field-name.blade.php
        ├── _field-color.blade.php
        └── _footer.blade.php

resources/js/components/
└── labelModal.js
```

## Frontend Pattern

### Orchestrator View

`labels/index.blade.php` is the orchestrator:
- initializes Alpine with `x-data="labelModal()"`
- includes header
- renders table or empty-state
- includes modal form

### Table + Empty State

- `_table.blade.php` contains the table with partials for header and rows
- `_empty-state.blade.php` shows a CTA to create the first label

## Modal (Alpine.js)

### Label Modal

Managed in:
- view: `labels/partials/_modal-form.blade.php`
- component: `resources/js/components/labelModal.js`

Flow:
- open create with `open-label-modal` event
- open edit with `edit-label` event (record payload)
- submit to route `labels.store` / `labels.update`

Component state:
- `open`, `isEdit`, `labelId`, `formData`

Behaviors:
- form reset on close
- close with `Esc`, backdrop, and click outside modal

## Table Actions

In `labels/partials/label-table/_row-actions.blade.php`:
- **edit**: button with `data-action="edit-label"` and payload from `toFormPayload()`
- **delete**: `labels.destroy` form with `data-confirm`

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `Alpine.data('labelModal', labelModal)`

The global `data-action` listener in `app.js` dispatches the `edit-label` custom event consumed by the modal.

## Internationalization

Labels frontend strings use:
- `lang/*/labels.php`
- `lang/*/ui.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes in the partials.
