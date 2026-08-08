---
title: Projects Module Backend - IndieDesk
sidebar_label: Backend
description: Project management in Laravel with lifecycle tracking, soft delete, profit stats and aggregated data. Query classes and CRUD patterns.
keywords: [Laravel projects, project management, project lifecycle, soft delete, Laravel CRUD, IndieDesk projects, project tracking]
---

# Backend

The Projects module manages the project lifecycle, detail with aggregated data, and statistics for the index.

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Projects/
│   │   │   ├── ProjectController.php
│   │   │   └── ProjectEditorController.php
│   │   └── Api/Projects/
│   │       └── ProjectSearchController.php
│   └── Requests/Projects/
│       ├── StoreProjectRequest.php
│       ├── UpdateProjectRequest.php
│       ├── UpdateEditorRequest.php
│       └── StoreEditorImageRequest.php
├── Models/
│   └── Project.php
└── Queries/Projects/
    ├── ProjectIndexQuery.php
    ├── ProjectShowQuery.php
    ├── ProjectStatsQuery.php
    └── ProjectProfitStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/projects` | index | Paginated project list |
| POST | `/projects` | store | Create new project |
| GET | `/projects/{project}` | show | Project detail |
| PUT | `/projects/{project}` | update | Update project |
| DELETE | `/projects/{project}` | destroy | Soft delete |
| POST | `/projects/{id}/restore` | restore | Restore project |
| DELETE | `/projects/{id}/force-delete` | forceDelete | Permanently delete |
| GET | `/api/search/projects` | __invoke | Project search for navbar |
| PUT | `/projects/{project}/editor` | update | Save editor content |
| POST | `/projects/{project}/editor/images` | uploadImage | Upload image from Trix editor |
| GET | `/projects/{project}/editor/images/{filename}` | serveImage | Serve private editor image |

Note: the `/projects/{project}/chat*` routes are part of the AI module and are documented in `docs/modules/AI/backend.md`.

## Controller

The `ProjectController` uses the **Query Classes** pattern to keep the controller lean.
Application queries are delegated to dedicated classes in `app/Queries/Projects/`.

### Methods

- **index()** - Uses `ProjectIndexQuery` for list/filters/pagination and `ProjectStatsQuery` for statistics cards
- **store()** - Validation via `StoreProjectRequest`, then record creation
- **show()** - Uses `ProjectShowQuery` for tab blocks (tasks, meetings, payments, costs, documents) and `ProjectProfitStatsQuery` for profit/margin

### ProjectEditorController

`ProjectEditorController` manages the rich text editor tab for project notes.

- **update()** - Saves `editor_notes` via `UpdateEditorRequest`, redirects back to `?tab=editor`
- **uploadImage()** - Accepts an image (`StoreEditorImageRequest`, max 20MB, jpeg/jpg/png/gif), stores it privately at `editor-images/{project_id}/{filename}`, returns `{ url }` JSON
- **serveImage()** - Streams the private image via `response()->file()` with `Cache-Control: private`
- **update()** - Validation via `UpdateProjectRequest`, with conditional redirect (`show` or `index`)
- **destroy()** - Soft delete
- **restore()** - Restore deleted record
- **forceDelete()** - Permanent deletion

### API Controller

`ProjectSearchController` exposes a search endpoint for the navbar:
- input `q` (minimum 2 characters)
- matches on project name, client name, or client VAT number
- limit 10 results

## Model

The `Project` model is located in `app/Models/Project.php`.

### Fields

The `editor_notes` column (`longText`, nullable) stores the HTML content produced by the Trix editor. It is separate from the plain-text `notes` field used in the project form.

Added via migration: `2026_03_12_114609_add_editor_notes_to_projects_table`.

### Features

- **SoftDeletes** - deleted projects are recoverable
- **Automatic slug** - unique slug generation in `creating`
- **Relationships** - `client` (single, `belongsTo`), `clients` (multiple, `belongsToMany` — SaaS only), `tasks`, `meetings`, `payments`, `costs`, `documents`
- **CalendarEventable** - calendar integration with Google Calendar link
- **toFormPayload()** - safe edit payload (`id` + editable fields)

### Project Statuses

| Status | Description |
|--------|-------------|
| `draft` | Draft |
| `in_progress` | In progress |
| `completed` | Completed |
| `archived` | Archived |

### Priorities

| Priority | Description |
|----------|-------------|
| `low` | Low |
| `medium` | Medium |
| `high` | High |

### Project Types

| Type | Description |
|------|-------------|
| `client_work` | Client work |
| `product` | Internal product |
| `content` | Content |
| `asset` | Internal assets |
| `saas` | SaaS product with multiple linked clients (see below) |

### SaaS Projects — Multiple Clients

A project with `type = 'saas'` can be linked to **multiple** clients instead of the single `client_id` used by other types.

- **Pivot table** `client_project` (`project_id`, `client_id`, unique pair) — created via migration `2026_08_07_202948_create_client_project_table`
- **`Project::clients()`** — `belongsToMany(Client::class, 'client_project')`
- **`Client::saasProjects()`** — inverse `belongsToMany`, in `app/Models/Client.php`
- On `store`/`update`, `ProjectController` extracts `client_ids` from the validated payload and calls `$project->clients()->sync($clientIds)` **only** when `type === 'saas'`; the pivot is cleared (`sync([])`) when a project's type changes away from `saas`, so it never carries stale links
- **`Project::getClientLabel(): ?string`** — returns the single client's name for regular projects, or the comma-joined names of all linked clients for `saas` projects, or `null` for internal projects. Used everywhere a project's client needs to be displayed (dashboard lists, statistics tables) so those views don't need to special-case SaaS projects
- `scopeForClient()` matches both the direct `client_id` and the `clients` pivot, so filtering/searching projects by client (`ProjectIndexQuery`) finds SaaS projects too

## Form Requests

Validation handled by:

- **StoreProjectRequest** - project creation
- **UpdateProjectRequest** - project update

### Required Fields

- `name` - project name
- `status` - status (`draft`, `in_progress`, `completed`, `archived`)
- `type` - type (`client_work`, `product`, `content`, `asset`, `saas`)

### Optional Fields

- dates: `start_date`, `due_date` (`due_date >= start_date`)
- client link: `client_id` (single client, non-SaaS types)
- multi-client link: `client_ids` (array, `exists:clients,id` each — only relevant for `type = 'saas'`, synced to the `client_project` pivot in the controller)
- priority: `priority`
- project URLs: `repo_url`, `staging_url`, `production_url`, `figma_url`, `docs_url`
- text: `description`, `notes`

**UpdateEditorRequest** - saves the rich text editor content:
- `editor_notes` (nullable string, raw HTML from Trix)

**StoreEditorImageRequest** - validates image uploads from the editor:
- `image` (required, file, mimes: jpeg/jpg/png/gif, max 20MB)

## Query Classes

The module uses the **Query Classes** pattern to separate query logic from the controller.

### ProjectIndexQuery

Manages the project list with:
- pagination (15)
- `status` filter
- `priority` filter
- `client_id` filter via `scopeForClient()` (matches direct client and SaaS pivot)
- search by project name or client data — including SaaS-linked clients (`orWhereHas('clients', ...)`)
- sorting with column/direction whitelist

### ProjectShowQuery

Composes the show page payload:
- latest records per tab (`tasks`, `meetings`, `payments`, `costs`, `documents`)
- total counts per tab (`tasksCount`, `meetingsCount`, etc.)
- configurable limit (default `10`)

### ProjectStatsQuery

Calculates index statistics:
- total projects
- count by status
- new projects this month
- completed in the current week
- useful percentages for cards

### ProjectProfitStatsQuery

Calculates financial KPIs for a single project, filtered by the default currency from `BusinessSettings::current()->default_currency`:
- total collected payments
- total costs
- absolute profit
- percentage margin
