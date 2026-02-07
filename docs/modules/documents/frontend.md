# Frontend

Il modulo Documents usa il pattern **Partial Views** per separare index globale e tab documenti della show progetto, con modal Alpine dedicato a upload/edit.

## Struttura File

```
resources/views/documents/
├── index.blade.php
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _labels.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _total.blade.php
│   │   └── _this-month.blade.php
│   └── document-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-name.blade.php
│       ├── _row-labels.blade.php
│       ├── _row-uploaded-at.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _document-table.blade.php
    ├── _modal.blade.php
    ├── _form-fields.blade.php
    ├── _file-upload.blade.php
    └── document-table/
        ├── _header.blade.php
        ├── _row.blade.php
        ├── _row-name.blade.php
        ├── _row-labels.blade.php
        ├── _row-uploaded-at.blade.php
        ├── _row-size.blade.php
        └── _row-actions.blade.php

resources/js/components/
└── documentModal.js
```

## Pattern Frontend

### Orchestrator Views

La vista `documents/index.blade.php` funziona da orchestrator:
- include header, statistiche e filtri
- sceglie table o empty-state in base ai risultati

Nel dettaglio progetto, la tab documenti usa `projects/show/_tab-documents.blade.php` e include la tabella riusabile `documents/partials/_document-table.blade.php`.

### Partial riusabili

Il modulo separa i due contesti UI:
- **Index globale documenti**: partial in `documents/index/*`
- **Tab documenti della show progetto**: partial in `documents/partials/*`

## Modal (Alpine.js)

### Document Modal

Gestito in:
- view: `documents/partials/_modal.blade.php`
- componente: `resources/js/components/documentModal.js`

Flusso:
- apertura create con evento `open-document-modal`
- apertura edit con evento `edit-document` (payload record)
- submit su route `documents.store` / `documents.update`

Comportamenti principali:
- il blocco upload file e visibile solo in create (`x-show="!isEdit"`)
- il bottone submit in create richiede sia `name` che file selezionato
- in edit aggiorna solo metadata/label
- supporta chiusura con `Esc` e click fuori modal

## Form Fields

`documents/partials/_form-fields.blade.php` gestisce:
- nome documento (`name`)
- label multiple (`label_ids[]`)
- note (`notes`)

`documents/partials/_file-upload.blade.php` gestisce input file e visualizzazione nome file selezionato.

## Azioni tabella

### Index globale (`documents/index/document-table/_row-actions.blade.php`)

- view project
- preview documento
- download documento

### Tab progetto (`documents/partials/document-table/_row-actions.blade.php`)

- preview
- download
- edit (evento `edit-document` con payload da `toFormPayload()`)
- delete (con `data-confirm`)

## Wiring JS globale

Registrazione componente in `resources/js/app.js`:
- `window.documentModal = documentModal`

Il listener globale `data-action` in `app.js` dispatcha gli eventi custom usati dal modal.

## Internazionalizzazione

Le stringhe frontend documents usano:
- `lang/*/documents.php`
- `lang/*/ui.php`

Il rendering badge etichette usa il componente Blade `x-documents.label-badge`.

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*`, coerente con il layout applicativo.
