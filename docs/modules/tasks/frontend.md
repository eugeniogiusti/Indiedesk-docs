# Frontend

The Tasks module uses the **Partial Views** pattern to keep the global index and tasks section in the project show modular and reusable.

## File Structure

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

## Frontend Pattern

### Orchestrator Views

The `tasks/index.blade.php` view acts as an orchestrator:
- includes header, statistics, filters
- chooses table or empty-state based on results

### Reusable Partials

The module separates the two UI contexts:
- **Global task index**: partials in `tasks/index/*`
- **Tasks tab of the project show**: partials in `tasks/partials/*`

`tasks/partials/_task-table.blade.php` is the reusable table used in the project show.

## Modal (Alpine.js)

The create/edit task form is managed in:
- view: `tasks/partials/_modal-form.blade.php`
- component: `resources/js/components/taskModal.js`

Flow:
- open create with `open-task-modal` event
- open edit with `edit-task` event (record payload)
- submit to route `tasks.store` / `tasks.update`

## Toggle Done (Alpine + AJAX)

The task status toggle in the project show is managed in:
- row view: `tasks/partials/_table-row.blade.php`
- component: `resources/js/components/taskToggle.js`

Behavior:
- optimistic UI (`done`/`todo`)
- AJAX call to `POST /projects/{project}/tasks/{task}/toggle-done`
- automatic rollback on error
- best-effort toggle sound (Web Audio API)

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `window.taskModal = taskModal`
- `Alpine.data('taskToggle', taskToggle)`

## Internationalization

Tasks frontend strings use the file:
- `lang/*/tasks.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
