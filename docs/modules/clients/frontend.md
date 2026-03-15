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
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _status.blade.php
│   │   └── _actions.blade.php
│   └── client-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
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

Renders the icon for a followup type. Accepts a `type` prop (`call`, `email`, `whatsapp`, `meeting`, `note`).

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
- Type label + date
- Note (if present)
- Actions on hover: Google Calendar link, edit button, delete form

---

## Alpine.js Component — `clientFollowupModal`

Located in `resources/js/components/clientFollowupModal.js`, registered in `app.js` as `Alpine.data('clientFollowupModal', ...)`.

Handles create and edit in a single modal, same pattern as `meetingModal`.

```js
openCreate()           // resets form, opens modal
openEdit(followupData) // pre-fills form with existing data, opens modal
closeModal()           // closes and resets after animation
```

Default form values: `type = 'call'`, `contacted_at = today`.

### UI → Modal Communication

Uses the centralized `data-action` + `data-payload` pattern — no inline JS in Blade.

| Action | Trigger |
|--------|---------|
| Open create modal | `data-action="open-followup-modal"` |
| Open edit modal | `data-action="edit-followup"` + `data-payload="{id, type, note, contacted_at}"` |
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

---

## Internationalization

All strings use Laravel's i18n system. Translation files: `lang/{locale}/clients.php`.

The `followup` key group contains all followup-related strings including type labels, validation messages, and action labels. Supported in all 13 project locales.

---

## Dark Mode

Full dark mode support via Tailwind `dark:*` classes. Theme management is centralized at the layout level.
