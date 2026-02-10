# Backend Patterns

This section describes the backend patterns used in the project (Laravel).

**1. Thin controllers**
- Responsibility: orchestrate, not contain business logic.
- Example: `app/Http/Controllers/Tasks/TaskController.php`.
- The controller calls queries for index and returns the view with data.

**2. FormRequest for validation**
- Every create or update action has a dedicated request.
- Examples:
- `app/Http/Requests/Tasks/StoreTaskRequest.php`
- `app/Http/Requests/Tasks/UpdateTaskRequest.php`

**3. Query objects for reads and filters**
- Queries are separated and reusable.
- Examples:
- `app/Queries/Tasks/TaskIndexQuery.php` for index filters.
- `app/Queries/Tasks/TaskStatsQuery.php` for statistics.
- Benefits: testable, reusable, cleaner controllers.

**4. Model scopes and constants**
- Models expose constants and scopes for filtering.
- Example: `Task::STATUSES`, `Task::TYPES`, scope `status()`, `type()`.

**5. Targeted redirects with context**
- After create/update/delete from Project Show, redirect back to the current tab:
- `route(projects.show, [project => $project, tab => tasks])`.

**6. JSON endpoints for interactive UI**
- For quick toggles (e.g. task done), JSON endpoints are used.
- Controller returns a payload with updated state for Alpine.

**7. toFormPayload() pattern in Models**

Models expose a `toFormPayload()` method that returns only safe fields for frontend forms: `id` + `$fillable` fields. This avoids exposing sensitive data or unnecessary relationships in the DOM.

For special fields (dates, many-to-many relationships) the method can format or add extra data. The method accepts an optional parameter to extend the payload.

**8. Services for domain logic**

Complex business logic is extracted into Service classes inside `app/Services/`, organized by domain (Invoices, Receipts, TwoFactor, etc.). Controllers stay lean by delegating operations to services. This makes logic testable and reusable.

**Naming and organization**
- Controllers per module in subfolders: `app/Http/Controllers/<Module>`.
- Queries per module in `app/Queries/<Module>`.
- Requests per module in `app/Http/Requests/<Module>`.
- Services per domain in `app/Services/<Domain>`.
