---
title: Tasks Module Frontend - IndieDesk
sidebar_label: Frontend
description: Task UI with Alpine.js components, Blade partials and AJAX toggles. Modal forms, table interactions and dark mode support.
keywords: [Alpine.js tasks, Blade components, task UI, frontend patterns, modal forms, IndieDesk frontend, AJAX interactions, dark mode]
---

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
│       ├── _card.blade.php          # mobile card layout
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-title.blade.php     # title + description + status & type badges
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

### Merged Columns

Both tables stack badges under an existing column instead of giving each its own, to reclaim horizontal space — the same treatment applied to Clients and Payments in v1.1.0:

| Table | Column | Contains |
|-------|--------|----------|
| Global index | **Title/Status** | title, description, then status + type badges |
| Project show | **Status/Priority** | status badge (Alpine-reactive to the done toggle), then priority badge |

In the project show table the status cell stays reactive: the three `x-show` badge variants (original status / toggled to done / toggled back to todo) are wrapped together with the priority badge in a `space-y-1` container, so toggling a task updates the badge without a page reload.

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

## Task Types

Available task types defined in `Task::TYPES`:
`feature`, `bug`, `improvement`, `research`, `administrative`, `marketing`, `other`.

Translation keys follow the pattern `tasks.type_{key}` (e.g. `tasks.type_marketing`, `tasks.type_improvement`).

## Due Date Badge

The `<x-tasks.due-date>` component applies colored badges based on the deadline:

| Condition | Label key | Color |
|-----------|-----------|-------|
| `isToday()` | `tasks.due_today` | blue |
| `isPast()` | `tasks.overdue` | red |
| within 3 days | `tasks.due_soon` | orange |

`isToday()` is checked **before** `isPast()` to prevent tasks due today from showing "Overdue".

## Document Attachment Indicators

Both the global task index (`tasks/index/task-table/_row-actions.blade.php`) and the project show task table (`tasks/partials/_table-row-actions.blade.php`) show document indicators on each row when `taskDocuments` is eager-loaded.

| Documents count | Behavior |
|-----------------|----------|
| 0 | No indicator shown |
| 1 | Eye icon (preview in new tab) + download icon |
| 2+ | Paperclip icon with numeric badge; clicking opens the edit modal where all docs are listed |

## Internationalization

Tasks frontend strings use the files:
- `lang/*/tasks.php`
- `lang/*/task_documents.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
