# Frontend

Il modulo Meetings usa il pattern **Partial Views** per mantenere index globale e sezione meetings nella show progetto modulari e riusabili.

## Struttura File

```
resources/views/meetings/
├── index.blade.php
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   ├── _date-from.blade.php
│   │   ├── _date-to.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _upcoming.blade.php
│   │   ├── _today.blade.php
│   │   ├── _this-week.blade.php
│   │   └── _completed.blade.php
│   └── meeting-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-title.blade.php
│       ├── _row-scheduled-at.blade.php
│       ├── _row-duration.blade.php
│       ├── _row-location.blade.php
│       ├── _row-status.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _meeting-table.blade.php
    ├── _modal-form.blade.php
    └── _form-fields.blade.php

resources/js/components/
└── meetingModal.js
```

## Pattern Frontend

### Orchestrator Views

La vista `meetings/index.blade.php` funziona da orchestrator:
- include header, statistiche, filtri
- sceglie table o empty-state in base ai risultati

### Partial riusabili

Il modulo separa i due contesti UI:
- **Index globale meetings**: partial in `meetings/index/*`
- **Tab meetings della show progetto**: partial in `meetings/partials/*`

`meetings/partials/_meeting-table.blade.php` è la tabella riusabile usata nella show progetto.

## Modal (Alpine.js)

Il form create/edit meeting è gestito in:
- view: `meetings/partials/_modal-form.blade.php`
- componente: `resources/js/components/meetingModal.js`

Flusso:
- apertura create con evento `open-meeting-modal`
- apertura edit con evento `edit-meeting` (payload record)
- submit su route `meetings.store` / `meetings.update`

Il componente normalizza il datetime per `input[type=datetime-local]` tramite `formatDateTimeForInput()`.

## Azioni in tabella show progetto

Nella tabella `meetings/partials/_meeting-table.blade.php` sono disponibili:
- link Google Calendar (se presente)
- edit meeting (dispatch evento con payload)
- delete meeting con conferma

## Wiring JS globale

Registrazione componente in `resources/js/app.js`:
- `window.meetingModal = meetingModal`

Il listener globale `data-action` in `app.js` dispatcha gli eventi custom usati dal modal.

## Internazionalizzazione

Le stringhe frontend meetings usano il file:
- `lang/*/meetings.php`

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*`, coerente con il layout applicativo.
