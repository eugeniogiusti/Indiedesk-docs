# Frontend

The Clients module uses the **Partial Views** pattern to keep views modular,
readable, and easily maintainable.

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
└── modals/
    └── _client-form.blade.php
```

---

## Frontend Pattern

### Orchestrator Views

The `index.blade.php` and `show.blade.php` views act as orchestrators:
they include partials without containing direct markup.

```php
<x-app-layout>
    @include('clients.index._header')
    @include('clients.index._stats-cards')
    @include('clients.index._filters')
    @include('clients.index._table')
    @include('clients.modals._client-form')
</x-app-layout>
```

---

### Partial Views

- Partials use the `_` prefix
- Complex sections are organized in subfolders
- Partials can include other partials (nested partials)

---

## Modal (Alpine.js)

The create/edit form is managed by a dedicated Alpine.js component
in `resources/js/components/clientModal.js`, registered globally in `resources/js/app.js`.

The component handles:
- create/edit state
- modal open/close
- tab navigation
- form data

### UI → Modal Communication

Buttons use `data-action` and `data-payload` attributes instead of inline JS. A global listener in `app.js` intercepts clicks and dispatches events that the Alpine component listens to.

- **Create**: the button has `data-action="open-client-modal"`
- **Edit**: the button has `data-action="edit-client"` with `data-payload` containing the record data (serialized by the model's `toFormPayload()` method)

The component receives data directly in the event, without needing to search through arrays.

### Delete with Confirmation

Delete forms use `data-confirm` with the confirmation message. The global listener intercepts the submit and shows the native confirmation dialog.

### Advantages

- Only necessary fields are exposed in the DOM
- No inline JS in Blade views
- Centralized and easy-to-modify logic

---

## Show Page Layout

The detail page uses a **sidebar + main content** layout.

Responsive grid:
- sidebar: `lg:col-span-1`
- main content: `lg:col-span-3`

---

## Internationalization

All strings use Laravel's i18n system.

Translation files are separated by module:
- `lang/it/clients.php`
- `lang/en/clients.php`

---

## Dark Mode

The frontend supports dark mode via Tailwind classes (`dark:*`).
Theme management is centralized at the layout level.
