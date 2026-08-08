---
title: Projects Module Frontend - IndieDesk
sidebar_label: Frontend
description: Project management UI with Alpine.js tabs, async client search and Blade orchestrator pattern. Multi-tab detail page and cross-module integration.
keywords: [Alpine.js projects, tab navigation, async search, Blade orchestrator, project UI, IndieDesk frontend, multi-tab interface, client search]
---

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
    ├── _tabs-nav.blade.php        # vertical tab navigation (sidebar)
    ├── _content-tabs.blade.php    # tab panels only, no nav
    ├── _client-info.blade.php
    ├── _quick-info.blade.php
    ├── _quick-links.blade.php
    ├── _tab-overview.blade.php
    ├── _tab-tasks.blade.php
    ├── _tab-meetings.blade.php
    ├── _tab-payments.blade.php
    ├── _tab-costs.blade.php
    ├── _tab-profit.blade.php
    ├── _tab-documents.blade.php
    ├── _tab-timesheets.blade.php
    ├── _tab-repository.blade.php
    └── _tab-editor.blade.php

resources/js/components/
├── projectModal.js
├── clientSearch.js         # single-client typeahead (non-SaaS projects)
├── clientMultiSearch.js    # multi-client typeahead, chips (SaaS projects)
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
2. Grid `grid-cols-1 lg:grid-cols-4`, with `x-data="{ activeTab: ... }"` and `x-cloak` on the **grid container itself** — this is the shared Alpine scope for both the sidebar nav and the tab content, since they're siblings, not nested:
   - **Sidebar** (1/4): `_tabs-nav` — vertical tab navigation only
   - **Main content** (3/4): `_content-tabs` — tab panels only, no navigation UI
3. `projects.modals._project-form` - edit project modal (outside the grid)
4. `ai._panel` - AI chatbot panel (conditional: only if AI is enabled in `AiSettings`)

### Sidebar Redesign (vertical tab nav)

The tab navigation used to be a horizontal bar at the top of `_content-tabs.blade.php`. It's now a vertical list in `_tabs-nav.blade.php`, placed in the sidebar column — same visual pattern as a typical dashboard nav. Consequences of the move:

- `_client-info`, `_quick-info`, `_quick-links` no longer live in the sidebar — they moved **inside the Overview tab** (see below), since the sidebar is now dedicated to navigation only
- Both `_tabs-nav` and `_content-tabs` read/write the same `activeTab` Alpine property, inherited from the shared `x-data` on their common parent (the grid `<div>` in `show.blade.php`) — Alpine resolves `formData`/`activeTab` lookups up the scope chain, so no event bus or store is needed between the two siblings
- The active tab still syncs with `?tab=...` in the URL on initial load

### Sticky Header

Back arrow, project name, type/status/priority badges, deadline. "Edit" button dispatches `edit-project`.

### _tabs-nav.blade.php (vertical tab navigation)

Renders the sidebar tab list — one button per tab, each with an SVG icon and i18n label, `@click="activeTab = '...'"`. The active tab gets an emerald background (`bg-emerald-50 text-emerald-700`), others are gray with hover. The Repository button is conditional, same rule as before (`$project->repo_url` contains `github.com`).

### _content-tabs.blade.php (tab content sub-orchestrator)

`_content-tabs.blade.php` now only renders tab **content**, no navigation UI:

- `activeTab` itself is initialized once, on the shared parent `x-data` in `show.blade.php` (see above) — not here
- Each tab is wrapped in `x-show="activeTab === '...'"` with `x-cloak`
- The Editor tab uses `<template x-if>` instead of `x-show` to avoid initializing Trix before the tab is opened
- Includes the corresponding `_tab-*.blade.php` partials

### Tabs

9 total tabs (Repository and Editor are always visible).

Each show tab includes **partials from other modules** to reuse existing tables and modals. The pattern is always the same: header with title + "Add" button, module partial table, "View all" link if > 50 records, empty state, and module form modal.

### Tab Overview

No external module partials, but now composes several sidebar-turned-content partials in order:

1. `_client-info` — client card (see "Client Display" below for the SaaS case)
2. Description + Notes (inline editable, see below)
3. `_quick-info` + `_quick-links`, side by side in a 2-column grid at the bottom

This ordering (client card prominent at the top, quick info/links demoted below) keeps the client card compact even for SaaS projects with many linked clients, since it's followed immediately by the rest of the tab content rather than competing for space with two other cards in a 3-column row.

#### Client Display (Client Info Card)

- **Regular project with a client** — `<x-client-summary>` (full contact card: VAT, email, WhatsApp)
- **Internal project** (no client) — "Internal Project" badge
- **SaaS project** — a compact `<ul>` of client names only, each linking to `clients.show`, in a `max-h-64 overflow-y-auto` scrollable container so the card stays a fixed size regardless of how many clients are linked (tested with 200). No `<x-client-summary>` per client here — full contact detail would make the card unusable at scale; the link is the entry point to that detail
- **SaaS project with no clients linked yet** — neutral "No clients linked" badge (distinct from "Internal Project", since a SaaS project isn't internal, just not yet configured)

Both fields support **inline editing** without opening the modal:
- Clicking "Edit" enters edit mode (textarea via `inlineField` Alpine.js component)
- Changes are saved via `PATCH /projects/{project}/field` with `{ field, value }`
- Display uses `whitespace-pre-wrap` to preserve newlines
- Translations (`ui.saved`, `ui.error_saving`) are passed from Blade to the component as parameters — no hardcoded strings in JS

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

### Tab Timesheets

Includes partials from the **Timesheets** module for monthly hour tracking. No cross-tab data from `$showData` — timesheets load independently.

### Tab Repository

Conditional tab (only shown when `$project->repo_url` contains `github.com`). Powered by the `repositoryTab` Alpine.js component — fetches data lazily from `GET /projects/{project}/repository` and renders a commit activity heatmap + recent commits list.

### Tab Editor

Rich text editor powered by **Trix**. Self-contained tab with no external module partials.

- Form `PUT /projects/{project}/editor` submits the hidden input `editor_notes`
- `<trix-editor>` is bound to the hidden input via the `input` attribute
- `data-upload-url` points to `POST /projects/{project}/editor/images` for inline image upload
- `data-error-upload` and `data-error-invalid-type` carry localized error strings for the toast
- Tab content uses `<template x-if>` (not `x-show`) so Trix is only initialized when the tab is first opened, avoiding unnecessary DOM work on page load
- Supported image formats: PNG, JPG, GIF — max 20MB
- Save button is disabled while an upload is in progress (re-enabled in the `finally` block)

### Cross-Module Dependency Summary

The project show is a **hub** that integrates partials from 5 external modules:

| Tab | Module | Table Partial | Modal Partial |
|-----|--------|---------------|---------------|
| Tasks | `tasks` | `_task-table` | `_modal-form` |
| Meetings | `meetings` | `_meeting-table` | `_modal-form` |
| Payments | `payments` | `_payment-table` | `_modal-form` + `_upload-invoice-modal` |
| Costs | `costs` | `_cost-table` | `_modal-form` + `_upload-receipt-modal` |
| Documents | `documents` | `_document-table` | `_modal` |

All data is prepared by the backend in `$showData` (via `ProjectShowQuery`) with a limit of 50 records per tab and total counts for the "View all" links.

## Modal (Alpine.js)

### Project Modal

Component: `projectModal.js`

State: `open`, `isEdit`, `projectId`, `activeTab`, `formData`.

3 internal tabs:

**Info:**
- Name (required)
- Type (dropdown: client_work, product, content, asset, saas)
- Client — the picker switches based on the selected type (`x-show="formData.type !== 'saas'"` / `=== 'saas'` on two sibling blocks, both reading the same `formData.type` from the parent `projectModal()` scope):
  - **Non-SaaS**: single client (optional, with "Internal project" checkbox) — async search via `clientSearch.js`, 300ms debounce, results dropdown, selected client badge
  - **SaaS**: multiple clients — async search via `clientMultiSearch.js`, same debounce/dropdown, but each selected result is added as a removable chip instead of replacing the field; submits `client_ids[]` hidden inputs
- Description, Status, Priority, Dates (start_date, due_date)

**Links:**
- repo_url, staging_url, production_url, figma_url, docs_url

**Notes:**
- Notes field (textarea)

Open: `open-project-modal` (create) and `edit-project` (edit with `toFormPayload()` payload) events.

### Client Search

Component: `clientSearch.js`

Asynchronous client search with debounce. Methods: `searchClients()`, `selectClient()`, `clearClient()`, `syncFromProject()`. Used for the single-client picker (non-SaaS project types).

### Client Multi-Search

Component: `clientMultiSearch.js`

Sibling of `clientSearch.js`, same search/debounce logic against `/api/clients/search`, but tracks `selectedClients` (array) instead of a single `selectedClient`. Methods: `searchClients()`, `addClient()`, `removeClient()`, `syncFromProject(clients)`, `reset()`. Used for the SaaS multi-client picker — each selection is appended as a chip, already-selected clients are filtered out of subsequent search results.

### Project Search

Component: `projectSearch.js`

Global project search for navbar on `/api/search/projects?q=`. Direct navigation to the selected project.

## JS Wiring

Component registration in `resources/js/app.js`:
- `Alpine.data('projectModal', projectModal)`
- `Alpine.data('clientSearch', clientSearch)`
- `Alpine.data('clientMultiSearch', clientMultiSearch)`
- `Alpine.data('projectSearch', projectSearch)`
- `Alpine.data('inlineField', inlineField)` — inline field editing for description/notes on the overview tab

### Trix Integration

Trix is imported globally in `app.js` (`import 'trix'`) and configured via two document-level event listeners:

**`trix-initialize`** — fires when a `<trix-editor>` mounts:
- Adds a click handler that opens links in a new tab (`_blank`), skipping image attachment anchors
- Sets `accept="image/jpeg,image/png,image/gif"` on the hidden file input (OS picker filter)

**`trix-attachment-add`** — fires when a file is dragged/pasted into the editor:
- Reads `data-upload-url` from the editor element
- Disables the form submit button during upload
- POSTs the file to the upload endpoint with the CSRF token
- On success: calls `attachment.setAttributes({ url })` to embed the image
- On failure: removes the attachment and shows an error toast via `Alpine.store('toast')`
- Always re-enables the submit button in `finally`


## Internationalization

Strings in `lang/*/projects.php` (13 supported languages: en, it, fr, es, de, nl, pt, pl, uk, ro, da, ru, zh).

Main keys: page titles, form fields, type/status/priority options (including `type_saas`), placeholders, statistics, tab labels and links.

Editor-specific keys: `editor_tab`, `editor_saved`, `editor_image_invalid_type`, `editor_image_upload_error`.

Date labels use `Carbon::translatedFormat(...)`.

## Dark Mode

Full support with Tailwind `dark:*` classes:
- Background: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-200 dark:border-gray-700`
- Card gradients: dark variant with reduced opacity
- Forms: `bg-white dark:bg-gray-700`
- **Trix editor**: toolbar and editor area overridden in `app.css` with gray-800/900 palette; toolbar icons inverted via `filter: invert(1)`
