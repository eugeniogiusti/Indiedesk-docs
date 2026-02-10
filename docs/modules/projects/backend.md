# Backend

The Projects module manages the project lifecycle, detail with aggregated data, and statistics for the index.

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Projects/
│   │   │   └── ProjectController.php
│   │   └── Api/Projects/
│   │       └── ProjectSearchController.php
│   └── Requests/Projects/
│       ├── StoreProjectRequest.php
│       └── UpdateProjectRequest.php
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

Note: the `/projects/{project}/chat*` routes are part of the AI module and are documented in `docs/modules/AI/backend.md`.

## Controller

The `ProjectController` uses the **Query Classes** pattern to keep the controller lean.
Application queries are delegated to dedicated classes in `app/Queries/Projects/`.

### Methods

- **index()** - Uses `ProjectIndexQuery` for list/filters/pagination and `ProjectStatsQuery` for statistics cards
- **store()** - Validation via `StoreProjectRequest`, then record creation
- **show()** - Uses `ProjectShowQuery` for tab blocks (tasks, meetings, payments, costs, documents) and `ProjectProfitStatsQuery` for profit/margin
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

### Features

- **SoftDeletes** - deleted projects are recoverable
- **Automatic slug** - unique slug generation in `creating`
- **Relationships** - `client`, `tasks`, `meetings`, `payments`, `costs`, `documents`
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

## Form Requests

Validation handled by:

- **StoreProjectRequest** - project creation
- **UpdateProjectRequest** - project update

### Required Fields

- `name` - project name
- `status` - status (`draft`, `in_progress`, `completed`, `archived`)
- `type` - type (`client_work`, `product`, `content`, `asset`)

### Optional Fields

- dates: `start_date`, `due_date` (`due_date >= start_date`)
- client link: `client_id`
- priority: `priority`
- project URLs: `repo_url`, `staging_url`, `production_url`, `figma_url`, `docs_url`
- text: `description`, `notes`

## Query Classes

The module uses the **Query Classes** pattern to separate query logic from the controller.

### ProjectIndexQuery

Manages the project list with:
- pagination (15)
- `status` filter
- `priority` filter
- search by project name or client data
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
