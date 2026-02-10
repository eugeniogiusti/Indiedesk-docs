# Frontend

The Projects module uses the **Orchestrator + Partials** pattern for index and show, with an Alpine.js modal for CRUD and asynchronous client search.

## File Structure

```
resources/views/projects/
├── index.blade.php                    (index orchestrator)
├── show.blade.php                     (show orchestrator)
├── modals/
│   └── _project-form.blade.php        (create/edit modal)
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── stats-cards/
│   │   ├── _total.blade.php
│   │   ├── _in-progress.blade.php
│   │   ├── _completed.blade.php
│   │   └── _archived.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   ├── _priority.blade.php
│   │   └── _actions.blade.php
│   └── project-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-name.blade.php
│       ├── _row-client.blade.php
│       ├── _row-status.blade.php
│       ├── _row-priority.blade.php
│       ├── _row-links.blade.php
│       ├── _row-created-at.blade.php
│       └── _row-actions.blade.php
└── show/
    ├── _header.blade.php
    ├── _content-tabs.blade.php
    ├── _client-info.blade.php
    ├── _project-stats.blade.php
    ├── _quick-links.blade.php
    ├── _tab-overview.blade.php
    ├── _tab-tasks.blade.php
    ├── _tab-meetings.blade.php
    ├── _tab-payments.blade.php
    ├── _tab-costs.blade.php
    ├── _tab-profit.blade.php
    └── _tab-documents.blade.php

resources/js/components/
├── projectModal.js
├── clientSearch.js
└── projectSearch.js
```

## Index

### Header

Icon with gradient, title, and "New Project" button that dispatches `open-project-modal`.

### Stats Cards

4-card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`):

| Card | Data | Gradient |
|------|------|----------|
| Total | project count + new this month | blue |
| In Progress | `in_progress` count | yellow |
| Completed | `completed` count | green |
| Archived | `archived` count | gray |

### Filters

GET form on `projects.index`:
- **Search** - text on project name, client name, VAT number
- **Status** - dropdown (all, draft, in_progress, completed, archived)
- **Priority** - dropdown (low, medium, high)
- **Actions** - Filter / Reset buttons

### Table

Columns: name, client, status badge, priority badge, dev links (icons), creation date, actions (edit/delete).
Pagination (15 per page).

### Empty State

Centered message with icon when there are no projects.

## Show

### show.blade.php (orchestrator)

`show.blade.php` is the main orchestrator of the project detail page. It composes the page by including:

1. `projects.show._header` - sticky header
2. Grid `grid-cols-1 lg:grid-cols-4`:
   - **Sidebar** (1/4): `_client-info`, `_project-stats`, `_quick-links`
   - **Main content** (3/4): `_content-tabs`
3. `projects.modals._project-form` - edit project modal (outside the grid)
4. `ai._panel` - AI chatbot panel (conditional: only if AI is enabled in `AiSettings`)

### Sticky Header

Back arrow, project name, type/status/priority badges, deadline. "Edit" button dispatches `edit-project`.

### Sidebar

- **Client info** - `x-client-summary` component, or "Internal Project" badge if no client
- **Project stats** - creation, update dates (`diffForHumans`), deadline with Google Calendar link
- **Quick links** - `x-projects.links` component with clickable icons (repo, staging, prod, figma, docs)

### _content-tabs.blade.php (tab sub-orchestrator)

`_content-tabs.blade.php` manages tab navigation and content. It is a sub-orchestrator that:

- Initializes Alpine.js with `activeTab` from query string (`?tab=costs`), default `overview`
- Renders the **navigation bar** with 7 tab buttons, each with SVG icon and i18n label
- The active tab shows an emerald border (`border-emerald-500`), others are gray with hover
- In the content block, each tab is wrapped in `x-show="activeTab === '...'"` with `x-cloak`
- Includes the corresponding `_tab-*.blade.php` partials

### Tabs

7 total tabs.

Each show tab includes **partials from other modules** to reuse existing tables and modals. The pattern is always the same: header with title + "Add" button, module partial table, "View all" link if > 10 records, empty state, and module form modal.

### Tab Overview

Project's own content: description + notes (with `nl2br`), no external partials.

### Tab Tasks

Includes partials from the **Tasks** module:
- `tasks.partials._task-table` - task table with data from `$showData['tasks']`
- `tasks.partials._modal-form` - create/edit task modal
- `tasks.index._empty-state` - empty state

Open event: `open-task-modal`. "View all" link points to `tasks.index` filtered by `project_id`.

### Tab Meetings

Includes partials from the **Meetings** module:
- `meetings.partials._meeting-table` - meetings table from `$showData['meetings']`
- `meetings.partials._modal-form` - create/edit meeting modal

Open event: `open-meeting-modal`. "View all" link points to `meetings.index` filtered by `project_id`.

### Tab Payments

Includes partials from the **Payments** module:
- `payments.partials._payment-table` - payments table from `$showData['payments']`
- `payments.partials._modal-form` - create/edit payment modal
- `payments.partials._upload-invoice-modal` - invoice upload modal

Open event: `open-payment-modal`. "View all" link points to `payments.index` filtered by `project_id`.

### Tab Costs

Includes partials from the **Costs** module:
- `costs.partials._cost-table` - costs table from `$showData['costs']`
- `costs.partials._modal-form` - create/edit cost modal
- `costs.partials._upload-receipt-modal` - receipt upload modal

Open event: `open-cost-modal`. "View all" link points to `costs.index` filtered by `project_id`.

### Tab Profit

The only tab without external partials - uses the `x-profit.stat-card` Blade component for the 4 KPI cards.

Currency shown via `$currencySymbol` (from `BusinessSettings` via `AppServiceProvider`):

| Card | Data | Gradient |
|------|------|----------|
| Total Profit | amount + margin % | emerald (green if positive, red if negative) |
| Total Payments | amount + count | blue |
| Total Costs | amount + count | red |
| ROI | `(profit/costs)*100%`, shows infinity if costs are zero | purple |

Two action buttons that switch tabs (`@click="activeTab = '...'"`)::
- "View Payments" (blue) with count badge
- "View Costs" (red) with count badge

### Tab Documents

Includes partials from the **Documents** module:
- `documents.partials._document-table` - documents table from `$showData['documents']`
- `documents.partials._modal` - document upload modal (also receives `$labels` from `Label::ordered()`)

Open event: `open-document-modal`. "View all" link points to `documents.index` filtered by `project_id`.

### Cross-Module Dependency Summary

The project show is a **hub** that integrates partials from 5 external modules:

| Tab | Module | Table Partial | Modal Partial |
|-----|--------|---------------|---------------|
| Tasks | `tasks` | `_task-table` | `_modal-form` |
| Meetings | `meetings` | `_meeting-table` | `_modal-form` |
| Payments | `payments` | `_payment-table` | `_modal-form` + `_upload-invoice-modal` |
| Costs | `costs` | `_cost-table` | `_modal-form` + `_upload-receipt-modal` |
| Documents | `documents` | `_document-table` | `_modal` |

All data is prepared by the backend in `$showData` (via `ProjectShowQuery`) with a limit of 10 records per tab and total counts for the "View all" links.

## Modal (Alpine.js)

### Project Modal

Component: `projectModal.js`

State: `open`, `isEdit`, `projectId`, `activeTab`, `formData`.

3 internal tabs:

**Info:**
- Name (required)
- Type (dropdown: client_work, product, content, asset)
- Client (optional, with "Internal project" checkbox)
  - Asynchronous search via `clientSearch.js` on `/api/clients/search?q=`
  - 300ms debounce, results dropdown, selected client badge
- Description, Status, Priority, Dates (start_date, due_date)

**Links:**
- repo_url, staging_url, production_url, figma_url, docs_url

**Notes:**
- Notes field (textarea)

Open: `open-project-modal` (create) and `edit-project` (edit with `toFormPayload()` payload) events.

### Client Search

Component: `clientSearch.js`

Asynchronous client search with debounce. Methods: `searchClients()`, `selectClient()`, `clearClient()`, `syncFromProject()`.

### Project Search

Component: `projectSearch.js`

Global project search for navbar on `/api/search/projects?q=`. Direct navigation to the selected project.

## JS Wiring

Component registration in `resources/js/app.js`:
- `Alpine.data('projectModal', projectModal)`
- `Alpine.data('clientSearch', clientSearch)`
- `Alpine.data('projectSearch', projectSearch)`

## Internationalization

Strings in `lang/*/projects.php` (10 supported languages: en, it, fr, es, de, nl, pt, pl, uk, ro, da).

Main keys: page titles, form fields, type/status/priority options, placeholders, statistics, tab labels and links.

Date labels use `Carbon::translatedFormat(...)`.

## Dark Mode

Full support with Tailwind `dark:*` classes:
- Background: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-200 dark:border-gray-700`
- Card gradients: dark variant with reduced opacity
- Forms: `bg-white dark:bg-gray-700`
