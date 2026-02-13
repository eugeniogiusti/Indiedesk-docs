---
title: Meetings Module Frontend - IndieDesk
sidebar_label: Frontend
description: Meeting management UI with Alpine.js modals, datetime inputs and Blade partials. Calendar integration, status filters and table components.
keywords: [Alpine.js meetings, meeting UI, datetime forms, Blade partials, calendar integration, IndieDesk frontend, meeting tables, modal forms]
---

# Frontend

The Meetings module uses the **Partial Views** pattern to keep the global index and meetings section in the project show modular and reusable.

## File Structure

```
resources/views/meetings/
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
│   │   ├── _date-from.blade.php
│   │   ├── _date-to.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _upcoming.blade.php
│   │   ├── _today.blade.php
│   │   ├── _this-week.blade.php
│   │   └── _completed.blade.php
│   └── meeting-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-title.blade.php
│       ├── _row-scheduled-at.blade.php
│       ├── _row-duration.blade.php
│       ├── _row-location.blade.php
│       ├── _row-status.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _meeting-table.blade.php
    ├── _modal-form.blade.php
    └── _form-fields.blade.php

resources/js/components/
└── meetingModal.js
```

## Frontend Pattern

### Orchestrator Views

The `meetings/index.blade.php` view acts as an orchestrator:
- includes header, statistics, filters
- chooses table or empty-state based on results

### Reusable Partials

The module separates the two UI contexts:
- **Global meetings index**: partials in `meetings/index/*`
- **Meetings tab of the project show**: partials in `meetings/partials/*`

`meetings/partials/_meeting-table.blade.php` is the reusable table used in the project show.

## Modal (Alpine.js)

The create/edit meeting form is managed in:
- view: `meetings/partials/_modal-form.blade.php`
- component: `resources/js/components/meetingModal.js`

Flow:
- open create with `open-meeting-modal` event
- open edit with `edit-meeting` event (record payload)
- submit to route `meetings.store` / `meetings.update`

The component normalizes the datetime for `input[type=datetime-local]` via `formatDateTimeForInput()`.

## Actions in Project Show Table

In the `meetings/partials/_meeting-table.blade.php` table the following are available:
- Google Calendar link (if present)
- edit meeting (dispatches event with payload)
- delete meeting with confirmation

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `window.meetingModal = meetingModal`

The global `data-action` listener in `app.js` dispatches the custom events used by the modal.

## Internationalization

Meetings frontend strings use the file:
- `lang/*/meetings.php`

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
