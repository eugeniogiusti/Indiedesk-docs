# Frontend

Il modulo Labels usa una singola pagina di gestione con partial Blade e modal Alpine per create/edit.

## Struttura File

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

## Pattern Frontend

### Orchestrator View

`labels/index.blade.php` e l'orchestratore:
- inizializza Alpine con `x-data="labelModal()"`
- include header
- renderizza tabella o empty-state
- include modal form

### Table + Empty State

- `_table.blade.php` contiene la tabella con partial per header e righe
- `_empty-state.blade.php` mostra CTA per creare la prima etichetta

## Modal (Alpine.js)

### Label Modal

Gestito in:
- view: `labels/partials/_modal-form.blade.php`
- componente: `resources/js/components/labelModal.js`

Flusso:
- apertura create con evento `open-label-modal`
- apertura edit con evento `edit-label` (payload record)
- submit su route `labels.store` / `labels.update`

Stato componente:
- `open`, `isEdit`, `labelId`, `formData`

Comportamenti:
- reset form su chiusura
- chiusura con `Esc`, backdrop e click fuori modal

## Azioni tabella

In `labels/partials/label-table/_row-actions.blade.php`:
- **edit**: bottone con `data-action="edit-label"` e payload da `toFormPayload()`
- **delete**: form `labels.destroy` con `data-confirm`

## Wiring JS globale

Registrazione componente in `resources/js/app.js`:
- `Alpine.data('labelModal', labelModal)`

Il listener globale `data-action` in `app.js` dispatcha l'evento custom `edit-label` consumato dal modal.

## Internazionalizzazione

Le stringhe frontend labels usano:
- `lang/*/labels.php`
- `lang/*/ui.php`

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*` nelle partial.
