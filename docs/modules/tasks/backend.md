---
title: Tasks Module Backend - IndieDesk
sidebar_label: Backend
description: Learn how the Tasks module manages project tasks in Laravel. Query classes, CRUD operations, status toggles, document attachments and project integration patterns.
keywords: [Laravel tasks, task management, Laravel CRUD, project tasks, query classes, IndieDesk tasks, task toggle, task documents]
---

# Backend

The Tasks module manages project operational tasks with a global index (filters + statistics) and CRUD within the project context. Tasks can also have file documents attached via the Task Documents sub-module.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Tasks/
│   │   ├── TaskController.php
│   │   └── TaskDocumentController.php
│   └── Requests/Tasks/
│       ├── StoreTaskRequest.php
│       ├── UpdateTaskRequest.php
│       └── StoreTaskDocumentRequest.php
├── Models/
│   ├── Task.php
│   └── TaskDocument.php
├── Services/Tasks/
│   └── TaskDocumentService.php
└── Queries/Tasks/
    ├── TaskIndexQuery.php
    └── TaskStatsQuery.php
```

## Routes

### Task Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/tasks` | index | Global paginated task list with filters |
| POST | `/projects/{project}/tasks` | store | Create task in the project |
| PUT | `/projects/{project}/tasks/{task}` | update | Update project task |
| POST | `/projects/{project}/tasks/{task}/toggle-done` | toggleDone | Quick `todo/done` status toggle (AJAX) |
| DELETE | `/projects/{project}/tasks/{task}` | destroy | Delete task |

### Task Document Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| POST | `/projects/{project}/tasks/{task}/documents` | store | Upload document to task |
| DELETE | `/projects/{project}/tasks/{task}/documents/{taskDocument}` | destroy | Delete task document |
| GET | `/projects/{project}/tasks/{task}/documents/{taskDocument}/download` | download | Download task document |
| GET | `/projects/{project}/tasks/{task}/documents/{taskDocument}/preview` | preview | Preview task document inline |

## TaskController

Uses the **Query Classes** pattern to separate query/filter logic from the controller. Also injects `TaskDocumentService` to handle optional file upload on create/update.

### Methods

- **index()** - Uses `TaskIndexQuery` for paginated list and `TaskStatsQuery` for statistics cards
- **store()** - Validates with `StoreTaskRequest`, creates task, optionally uploads document if `file` is present
- **update()** - Validates with `UpdateTaskRequest`, updates task, optionally uploads new document if `file` is present
- **toggleDone()** - Quick status toggle (`done` ↔ `todo`) and returns JSON (`status`, `isDone`)
- **destroy()** - Deletes task and returns to the tasks tab of the project show

## TaskDocumentController

Handles the full lifecycle of documents attached to tasks.

### Methods

- **store()** - Validates with `StoreTaskDocumentRequest`, delegates upload to `TaskDocumentService`
- **destroy()** - Delegates deletion (file + record) to `TaskDocumentService`
- **download()** - Returns a streamed file download response
- **preview()** - Returns an inline `BinaryFileResponse` for browser preview

## Task Model

The `Task` model is located in `app/Models/Task.php`.

### Features

- **project relationship** - each task belongs to a project
- **taskDocuments relationship** - `hasMany(TaskDocument::class)`, ordered by `uploaded_at desc`
- **Domain constants** - `TYPES`, `STATUSES`, `PRIORITIES` also used in validation
- **Scopes** - `status()`, `type()`, `priority()`, `overdue()`, `open()`
- **Status helpers** - `isDone()`, `isBlocked()`, `isOverdue()`
- **CalendarEventable** - calendar event support when `due_date` is present
- **toFormPayload()** - edit payload including `due_date` normalized to `Y-m-d` and `documents` array with `id`, `name`, `extension`, `download_url`, `delete_url`

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
| `improvement` | Improvement to existing functionality |
| `bug` | Bug fix |
| `infra` | Infrastructure |
| `refactor` | Refactoring |
| `research` | Research/analysis |
| `administrative` | Administrative task |
| `marketing` | Marketing activity |
| `hardware` | Hardware-related task |
| `documentation` | Documentation writing/update |
| `maintenance` | Package/software updates and maintenance |

### Priorities

| Priority | Description |
|----------|-------------|
| `low` | Low |
| `medium` | Medium |
| `high` | High |

## TaskDocument Model

The `TaskDocument` model is located in `app/Models/TaskDocument.php`.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | FK | Parent task |
| `name` | string | Display name |
| `file_path` | string | Path in local storage (`task-documents/`) |
| `uploaded_at` | datetime | Upload timestamp |
| `notes` | string\|null | Optional notes |

### Helpers

- **getDownloadUrl()** - returns route `task-documents.download`
- **getPreviewUrl()** - returns route `task-documents.preview`
- **getDeleteUrl()** - returns route `task-documents.destroy`
- **file_size** (accessor) - human-readable size (B / KB / MB)
- **file_extension** (accessor) - extension from `file_path`

## Form Requests

### Task Requests

- **StoreTaskRequest** - task creation (`due_date` requires `after_or_equal:today`)
- **UpdateTaskRequest** - task update (`due_date` only requires `date`)

### Required Fields (both requests)

- `title` - task title
- `type` - type (from `Task::TYPES`)
- `status` - status (from `Task::STATUSES`)

### Optional Fields

- `description`, `priority`, `due_date`, `order`
- `file` - optional document upload (handled in controller, not in task fillable)
- `document_name` - display name for the uploaded file (falls back to original filename)

### StoreTaskDocumentRequest

| Field | Rules |
|-------|-------|
| `name` | required, string, max:255 |
| `file` | required, file, max:30720 (30MB), mimes: pdf, jpg, jpeg, png, webp, zip, 7z, rar |
| `notes` | nullable, string, max:1000 |

## TaskDocumentService

Located in `app/Services/Tasks/TaskDocumentService.php`. Handles the full file lifecycle.

### Methods

- **upload()** - stores file in `storage/app/task-documents/` with a unique timestamped name, creates `TaskDocument` record
- **delete()** - deletes physical file from storage and the database record
- **download()** - returns a `StreamedResponse` for file download
- **preview()** - returns a `BinaryFileResponse` with `Content-Disposition: inline` for browser preview

Files are named `taskdoc-{timestamp}-{random16hex}.{ext}` to avoid collisions.

## Query Classes

### TaskIndexQuery

Manages the global task list with:
- pagination (20)
- eager loading `project` and `taskDocuments`
- filters `project_id`, `status`, `type`, `priority`
- search on title, description, project name
- sorting by `order`, then `created_at desc`

### TaskStatsQuery

Calculates statistics for index cards:
- `todo`
- `in_progress`
- `blocked`
- `bugs_open` (`type=bug` + `open()` scope)
