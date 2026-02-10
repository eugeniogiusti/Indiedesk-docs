# Frontend Patterns

This section describes the frontend patterns in Blade and Alpine.

**1. Module structure (index vs show)**
- `resources/views/<module>/index`: index views, with dedicated partials.
- `resources/views/<module>/partials`: views reused in Project Show.
- Tasks example:
- Index: `resources/views/tasks/index/*`
- Show: `resources/views/tasks/partials/_task-table.blade.php`

**2. Index pattern**
- The index page includes partials in sequence:
- Header, stats-cards, filters, table or empty-state.
- Example file: `resources/views/tasks/index.blade.php`.

**3. Project show with tabs pattern**
- Tab container: `resources/views/projects/show/_content-tabs.blade.php`.
- Each tab includes a dedicated partial:
- `_tab-tasks`, `_tab-payments`, `_tab-costs`, `_tab-documents`.
- Tab logic is managed by Alpine (`x-data`, `x-show`, `x-cloak`).

**4. Reusable tables**
- Tables in Project Show reuse module partials:
- `tasks/partials/_task-table.blade.php`
- `payments/partials/_payment-table.blade.php`
- `costs/partials/_cost-table.blade.php`
- `documents/partials/_document-table.blade.php`

**5. Modals**
- Each tab includes its own modal form.
- Opened via `$dispatch(open-...-modal)`.
- Modals defined in dedicated partials inside `resources/views/<module>/partials/`.

**6. Blade components**
- Reusable components for consistent UI (e.g. cards, badge, modal).
- Example: `resources/views/components/profit/stat-card.blade.php`.

**7. Alpine for local interactions**
- Alpine components registered in `resources/js/app.js`.
- Example: `taskToggle` to update task status via fetch.

**8. Global listeners for common actions**

The `app.js` file contains global listeners that handle recurring patterns without inline JS.

- **data-action**: Buttons use `data-action="event-name"` and optionally `data-payload` with JSON data. The listener intercepts the click and dispatches a CustomEvent that the Alpine component listens to.

- **data-confirm**: Delete forms use `data-confirm="message"`. The listener intercepts the submit and shows a native confirmation before proceeding.

This approach centralizes logic, eliminates inline JS from views and makes it easy to modify behavior globally (e.g. replace `confirm()` with a custom modal).

**9. Internationalization (i18n)**

All strings use the Laravel translation system via `__('key')`. Translation files are in `lang/` organized by language and module (e.g. `lang/it/clients.php`, `lang/en/clients.php`). No strings are hardcoded in views, making the app ready for translations.

**Naming and consistency**
- `_` prefix for reusable partials.
- `partials` folders for show, `index` for index.
- Keep Tailwind classes consistent across modules.
