# Backend

The Tasks module manages project operational tasks with a global index (filters + statistics) and CRUD within the project context.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Tasks/
│   │   └── TaskController.php
│   └── Requests/Tasks/
│       ├── StoreTaskRequest.php
│       └── UpdateTaskRequest.php
├── Models/
│   └── Task.php
└── Queries/Tasks/
    ├── TaskIndexQuery.php
    └── TaskStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/tasks` | index | Global paginated task list with filters |
| POST | `/projects/{project}/tasks` | store | Create task in the project |
| PUT | `/projects/{project}/tasks/{task}` | update | Update project task |
| POST | `/projects/{project}/tasks/{task}/toggle-done` | toggleDone | Quick `todo/done` status toggle (AJAX) |
| DELETE | `/projects/{project}/tasks/{task}` | destroy | Delete task |

## Controller

The `TaskController` uses the **Query Classes** pattern to separate query/filter logic from the controller.

### Methods

- **index()** - Uses `TaskIndexQuery` for paginated list and `TaskStatsQuery` for statistics cards
- **store()** - Validates with `StoreTaskRequest`, creates task in the project and redirects to `projects.show?tab=tasks`
- **update()** - Validates with `UpdateTaskRequest`, updates task and redirects to the tasks tab of the project show
- **toggleDone()** - Quick status toggle (`done` ↔ `todo`) and returns JSON (`status`, `isDone`)
- **destroy()** - Deletes task and returns to the tasks tab of the project show

## Model

The `Task` model is located in `app/Models/Task.php`.

### Features

- **project relationship** - each task belongs to a project
- **Domain constants** - `TYPES`, `STATUSES`, `PRIORITIES` also used in validation
- **Scopes** - `status()`, `type()`, `priority()`, `overdue()`, `open()`
- **Status helpers** - `isDone()`, `isBlocked()`, `isOverdue()`
- **CalendarEventable** - calendar event support when `due_date` is present
- **toFormPayload()** - edit payload with `due_date` normalized to `Y-m-d`

### Task Statuses

| Status | Description |
|--------|-------------|
| `todo` | To do |
| `in_progress` | In progress |
| `blocked` | Blocked |
| `done` | Done |

### Task Types

| Type | Description |
|------|-------------|
| `feature` | Feature development |
| `bug` | Bug fix |
| `infra` | Infrastructure |
| `refactor` | Refactoring |
| `research` | Research/analysis |
| `administrative` | Administrative task |

### Priorities

| Priority | Description |
|----------|-------------|
| `low` | Low |
| `medium` | Medium |
| `high` | High |

## Form Requests

Validation handled by:

- **StoreTaskRequest** - task creation
- **UpdateTaskRequest** - task update

### Required Fields

- `title` - task title
- `type` - type (from `Task::TYPES`)
- `status` - status (from `Task::STATUSES`)

### Optional Fields

- `description` - text description
- `priority` - priority (from `Task::PRIORITIES`)
- `due_date` - due date
- `order` - manual ordering

Note difference: in `StoreTaskRequest` `due_date` requires `after_or_equal:today`, while in `UpdateTaskRequest` it is only `date`.

## Query Classes

The module uses the **Query Classes** pattern to keep query logic out of the controller.

### TaskIndexQuery

Manages the global task list with:
- pagination (20)
- eager loading project
- filters `project_id`, `status`, `type`, `priority`
- search on title, description, project name
- sorting by `order`, then `created_at desc`

### TaskStatsQuery

Calculates statistics for index cards:
- `todo`
- `in_progress`
- `blocked`
- `bugs_open` (`type=bug` + `open()` scope)
