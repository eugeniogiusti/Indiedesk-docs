---
title: Clients Module Frontend - IndieDesk
sidebar_label: Frontend
description: Client UI with Alpine.js modals, Blade partial views and orchestrator pattern. Tab navigation, dark mode and responsive design.
keywords: [Alpine.js modals, Blade partials, client UI, orchestrator pattern, tab navigation, IndieDesk frontend, responsive design, dark mode]
---

# Frontend

The Clients module uses the **Partial Views** pattern to keep views modular, readable, and easily maintainable.

The main views do not contain direct markup but orchestrate the inclusion of partials.

---

## File Structure

```
resources/views/clients/
├── index.blade.php              # List view (orchestrator)
├── show.blade.php               # Detail view (orchestrator)
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── _followup-stats-cards.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   ├── _followup-status.blade.php
│   │   ├── _contacted-today.blade.php
│   │   ├── _followup-date.blade.php
│   │   ├── _acquisition-source.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _followup-never.blade.php
│   │   ├── _followup-first-contact.blade.php
│   │   ├── _followup-second-contact.blade.php
│   │   ├── _followup-exhausted.blade.php
│   │   └── _followup-today.blade.php
│   └── client-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-followups-count.blade.php
│       └── _row-actions.blade.php
├── show/
│   ├── _header.blade.php
│   ├── _client-info.blade.php
│   ├── _projects.blade.php
│   ├── _tasks.blade.php
│   ├── _meetings.blade.php
│   ├── _payments.blade.php
│   ├── _costs.blade.php
│   └── _documents.blade.php
├── followups/
│   ├── _section.blade.php       # Container — visible only if client is lead
│   ├── _list.blade.php          # Chronological log of followups
│   └── _quick-actions.blade.php # Quick action buttons (call, WhatsApp, email)
└── modals/
    ├── _client-form.blade.php
    └── _followup-form.blade.php
```

---

## Frontend Pattern

### Orchestrator Views

The `index.blade.php` and `show.blade.php` views act as orchestrators.

`index/_header.blade.php` has two actions: an "Export Excel" link (`route('clients.export', request()->query())` — carries over whatever filters are currently applied) and the "New Client" button that dispatches `open-client-modal`.

`show.blade.php` conditionally includes the followup section and modal only when the client is a lead:

```blade
@if($client->isLead())
    @include('clients.followups._section')
@endif

@if($client->isLead())
    @include('clients.modals._followup-form')
@endif
```

---

## Blade Components

### `<x-whatsapp-link>`

Renders a WhatsApp link. Receives the pre-built URL from the model and the phone number as slot text. **No URL logic in the component.**

```blade
<x-whatsapp-link :href="$client->whatsappUrl()">
    {{ $client->phone_prefix }} {{ $client->phone }}
</x-whatsapp-link>
```

The URL is built by `Client::whatsappUrl()` on the model — single source of truth.

### `<x-followup-type-icon>`

Renders the icon for a followup type. Accepts a `type` prop (`call`, `email`, `whatsapp`, `linkedin`).

WhatsApp and LinkedIn are rendered as filled brand logos (`fill="currentColor"`, brand blue for LinkedIn); call and email come from a small stroked-icon map with `call` as the fallback for an unknown type.

```blade
<x-followup-type-icon :type="$followup->type" />
<x-followup-type-icon type="call" />
```

Used both in `_list.blade.php` (per-row icon) and `_quick-actions.blade.php` (action buttons).

---

## Follow-up Section (Leads Only)

Visible only when `$client->isLead()` returns `true`. Disappears automatically once the client is converted to active.

**`_section.blade.php`** — amber-bordered container with:
- Header with followup count badge and "Add follow-up" button
- Quick action buttons (`_quick-actions.blade.php`)
- Chronological followup list (`_list.blade.php`)

**`_quick-actions.blade.php`** — call, WhatsApp, email buttons. Uses `<x-whatsapp-link>` and `<x-email-link>` components. No logic — only display.

**`_list.blade.php`** — list of followups ordered by `contacted_at` desc. Each row shows:
- Type icon via `<x-followup-type-icon>`
- Type label + date + a green "Done" / amber "To do" status badge
- Note (if present)
- A **permanently visible** check-circle button that toggles done/to-do in one click (`PATCH .../toggle-complete`)
- Actions on hover: Google Calendar link, edit button, delete form

The toggle sits outside the `opacity-0 group-hover:opacity-100` wrapper on purpose: it's the action you reach for when a calendar reminder fires, so it must not require hovering to be discoverable (and hover doesn't exist on touch devices).

---

## Follow-up Stat Cards & Filters (Index)

`_followup-stats-cards.blade.php` renders a second card row under the status cards, fed by `ClientFollowupStatsQuery`: never contacted, 1st contact made, 2nd contact made, exhausted (3+), contacted today.

The four funnel cards reuse the **existing filter labels** (`clients.followup.filter.*`) instead of introducing parallel wording, so a card and the dropdown option that reproduces it always read the same. All bucketing is computed in the query class — the Blade files only print a number, no logic in the views.

Matching filters on the same page: `_followup-status` (the funnel buckets), `_contacted-today`, and `_followup-date` (a single date input — pick a day, get the clients contacted that day).

---

## Alpine.js Component — `clientFollowupModal`

Located in `resources/js/components/clientFollowupModal.js`, registered in `app.js` as `Alpine.data('clientFollowupModal', ...)`.

Handles create and edit in a single modal, same pattern as `meetingModal`.

```js
openCreate()           // resets form, opens modal
openEdit(followupData) // pre-fills form with existing data, opens modal
closeModal()           // closes and resets after animation
```

Default form values: `type = 'call'`, `contacted_at = today`, `completed = true`.

A `$watch` on `formData.contacted_at` auto-unchecks `completed` when a **future** date is picked while creating (a contact you're scheduling hasn't happened yet), and leaves it alone in edit mode so it never overrides a deliberate choice. The checkbox is paired with a hidden input so an unchecked box still submits `0` rather than omitting the field.

### UI → Modal Communication

Uses the centralized `data-action` + `data-payload` pattern — no inline JS in Blade.

| Action | Trigger |
|--------|---------|
| Open create modal | `data-action="open-followup-modal"` |
| Open edit modal | `data-action="edit-followup"` + `data-payload="{id, type, note, contacted_at, completed}"` |
| Toggle done/to-do | plain `PATCH` form, no JS |
| Delete with confirm | `data-confirm="..."` on the form |

The modal listens on window events:
```blade
@open-followup-modal.window="openCreate()"
@edit-followup.window="openEdit($event.detail)"
```

---

## Show Page Layout

Sidebar + main content layout (responsive grid):
- Sidebar: `lg:col-span-1` — client info (contact, billing, web, notes)
- Main content: `lg:col-span-3` — followup section (leads only), projects, tasks, meetings, payments, costs, documents

`_projects.blade.php` (recent projects card) shows a "SaaS" `<x-projects.type-badge>` next to status/priority when the listed project is `type = 'saas'` — since a client can now be linked to a project only through the SaaS `client_project` pivot (no direct `client_id`), the badge is the visual cue for why a project the client "isn't the owner of" still shows up in their list. The underlying project list itself already includes SaaS-linked projects, not just directly-owned ones — see `ClientShowQuery` in the backend docs.

---

## Internationalization

All strings use Laravel's i18n system. Translation files: `lang/{locale}/clients.php`.

The `followup` key group contains all followup-related strings including type labels, validation messages, and action labels. Supported in all 13 project locales.

---

## Dark Mode

Full dark mode support via Tailwind `dark:*` classes. Theme management is centralized at the layout level.
