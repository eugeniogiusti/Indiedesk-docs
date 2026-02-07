# Frontend

Il modulo Tasks usa il pattern **Partial Views** per mantenere index globale e sezione tasks nella show progetto modulari e riusabili.

## Struttura File

```
resources/views/tasks/
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
│   │   ├── _type.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _todo.blade.php
│   │   ├── _in-progress.blade.php
│   │   ├── _blocked.blade.php
│   │   └── _bugs-open.blade.php
│   └── task-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-title.blade.php
│       ├── _row-type.blade.php
│       ├── _row-status.blade.php
│       ├── _row-priority.blade.php
│       ├── _row-due-date.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _task-table.blade.php
    ├── _table-row.blade.php
    ├── _table-row-actions.blade.php
    ├── _modal-form.blade.php
    └── _form-fields.blade.php

resources/js/components/
├── taskModal.js
└── taskToggle.js
```

## Pattern Frontend

### Orchestrator Views

La vista `tasks/index.blade.php` funziona da orchestrator:
- include header, statistiche, filtri
- sceglie table o empty-state in base ai risultati

### Partial riusabili

Il modulo separa i due contesti UI:
- **Index globale task**: partial in `tasks/index/*`
- **Tab tasks della show progetto**: partial in `tasks/partials/*`

`tasks/partials/_task-table.blade.php` è la tabella riusabile usata nella show progetto.

## Modal (Alpine.js)

Il form create/edit task è gestito in:
- view: `tasks/partials/_modal-form.blade.php`
- componente: `resources/js/components/taskModal.js`

Flusso:
- apertura create con evento `open-task-modal`
- apertura edit con evento `edit-task` (payload record)
- submit su route `tasks.store` / `tasks.update`

## Toggle Done (Alpine + AJAX)

Il toggle stato task nella show progetto è gestito in:
- row view: `tasks/partials/_table-row.blade.php`
- componente: `resources/js/components/taskToggle.js`

Comportamento:
- optimistic UI (`done`/`todo`)
- chiamata AJAX a `POST /projects/{project}/tasks/{task}/toggle-done`
- rollback automatico in caso di errore
- suono toggle best-effort (Web Audio API)

## Wiring JS globale

Registrazione componenti in `resources/js/app.js`:
- `window.taskModal = taskModal`
- `Alpine.data('taskToggle', taskToggle)`

## Internazionalizzazione

Le stringhe frontend tasks usano il file:
- `lang/*/tasks.php`

## Dark Mode

Il modulo supporta dark mode tramite classi Tailwind `dark:*`, coerente con il layout applicativo.
