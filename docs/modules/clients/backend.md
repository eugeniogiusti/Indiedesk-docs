---
title: Clients Module Backend - IndieDesk
sidebar_label: Backend
description: Client registry management in Laravel with soft delete, filters, search and statistics. Query classes pattern and CRUD operations.
keywords: [Laravel clients, client management, soft delete, Laravel CRM, client registry, IndieDesk clients]
---

# Backend

The Clients module manages the client registry with support for soft delete, filters, search, statistics, and lead follow-up tracking.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Clients/
│   │   ├── ClientController.php
│   │   └── ClientFollowupController.php
│   └── Requests/Clients/
│       ├── StoreClientRequest.php
│       ├── UpdateClientRequest.php
│       ├── StoreClientFollowupRequest.php
│       └── UpdateClientFollowupRequest.php
├── Models/
│   ├── Client.php
│   └── ClientFollowup.php
├── Queries/Clients/
│   ├── ClientIndexQuery.php
│   ├── ClientShowQuery.php
│   ├── ClientStatsQuery.php
│   └── ClientFollowupStatsQuery.php
└── Services/Clients/
    └── ClientExcelExporter.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/clients` | index | Paginated client list |
| GET | `/clients/export` | export | Excel (.xlsx) export, honors the index filters. Registered **before** the resource route to avoid colliding with `GET /clients/{client}` |
| POST | `/clients` | store | Create new client |
| GET | `/clients/{client}` | show | Client detail |
| PUT | `/clients/{client}` | update | Update client |
| DELETE | `/clients/{client}` | destroy | Soft delete |
| POST | `/clients/{id}/restore` | restore | Restore client |
| DELETE | `/clients/{id}/force-delete` | forceDelete | Permanently delete |
| POST | `/clients/{client}/followups` | followups.store | Create followup |
| PATCH | `/clients/{client}/followups/{followup}` | followups.update | Update followup |
| DELETE | `/clients/{client}/followups/{followup}` | followups.destroy | Delete followup |
| PATCH | `/clients/{client}/followups/{followup}/toggle-complete` | followups.toggle-complete | Flip the done / to-do state in one click |

## Controllers

### ClientController

Uses the **Query Classes** pattern to keep the controller lean.

- **index()** - Uses `ClientIndexQuery` + `ClientStatsQuery` + `ClientFollowupStatsQuery`. The "Total clients" stat counts `active` clients only — leads aren't converted yet and archived clients aren't clients any more.
- **export()** - Injects `ClientExcelExporter` and returns `->download()`. No query duplication: the exporter reuses `ClientIndexQuery::query()` (see below), so the exported rows always match whatever filters were active on the index page
- **store()** - Validation via `StoreClientRequest`
- **show()** - Uses `ClientShowQuery` to load related data
- **update()** - Supports conditional redirect (returns to show if edited from there)
- **destroy()** - Soft delete
- **restore()** / **forceDelete()** - Recovery and permanent deletion

### ClientFollowupController

Thin controller for lead follow-up CRUD, plus Google Calendar sync (`GoogleCalendarSync` injected in the constructor).

- **store()** - `$client->followups()->create($request->validated())`
- **update()** - `$followup->update($request->validated())`
- **destroy()** - removes the calendar event first, then `$followup->delete()`
- **toggleComplete()** - flips `completed` and re-syncs that one record

`store()`, `update()` and `destroy()` don't sync only the record they touched: they call the private `syncClientFollowups()`, which re-syncs **every** follow-up of that client. The reason is the sequence number in the event title — adding, deleting or re-dating one follow-up shifts every later one's position, so their calendar events would otherwise keep a stale number. `toggleComplete()` is exempt because flipping the done state doesn't reorder anything.

The loop passes the already-loaded client down with `setRelation('client', $client)` to avoid an N+1 when each follow-up builds its event title. When Google Calendar isn't connected the sync returns immediately, so the loop costs one query and no HTTP calls.

## Models

### Client

Located in `app/Models/Client.php`.

**Features:**
- **SoftDeletes** - Deleted clients are recoverable
- **relationships** - `projects()` (direct client_work-style projects, `hasMany`), `saasProjects()` (SaaS projects this client is linked to via the `client_project` pivot, `belongsToMany`), `followups()` (ordered by `contacted_at` desc)
- **Scopes** - `active()`, `leads()`, `archived()`
- **isLead()** - Returns `true` if status is `lead`
- **whatsappUrl()** - Builds the `wa.me/` URL from `phone_prefix` + `phone`. Returns `null` if no phone. Single source of truth — used by the `<x-whatsapp-link>` component and any other view.
- **toFormPayload()** - Returns only `id` + `$fillable` for edit forms

**Client Statuses:**

| Status | Description |
|--------|-------------|
| `lead` | Potential client, not yet converted |
| `active` | Active client |
| `archived` | Archived client |

### ClientFollowup

Located in `app/Models/ClientFollowup.php`.

Implements `CalendarEventable` — each followup is an all-day Google Calendar event on `contacted_at`, created manually via link or synced automatically (see [Calendar module](../calendar/backend.md#automatic-sync)).

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `client_id` | FK | Parent client |
| `type` | enum | `call`, `email`, `whatsapp`, `linkedin` |
| `note` | text (nullable) | Free text note |
| `contacted_at` | date | Date of contact |
| `completed` | bool (default `true`) | Whether the contact actually happened |
| `google_event_id` | string (nullable) | Linked Google Calendar event; not `$fillable` |

The type enum tracks **how the lead was contacted**, so it only holds real outbound channels. `meeting` and `note` were removed in v1.4.0 — a meeting belongs to the Meetings module and a note is the `note` field, neither is a contact attempt.

**The `completed` flag** turns a follow-up into either a log entry or a reminder. Logging a past contact leaves it `true`; scheduling the next one with a future date makes it `false`, the event lands on the calendar, and the one-click toggle marks it done when the alert fires. Everything that counts follow-ups (stat cards, index filters, the "last contact" date) counts **completed ones only**, so a planned-but-not-done contact never inflates the attempt count.

**Methods:**
- `googleCalendarUrl()` - Returns the Google Calendar pre-filled URL
- `hasCalendarDate()` - Returns `true` if `contacted_at` is set
- `calendarTitleBody()` - Stable title without the state prefix or number, used by the sync's duplicate check
- `sequenceNumber()` - Chronological position among that client's follow-ups (`contacted_at` asc, `id` as tiebreak); `1` = first contact attempt. Shown as `#N` in the calendar event title

## Form Requests

| Request | Usage |
|---------|-------|
| `StoreClientRequest` | Client creation (unique email) |
| `UpdateClientRequest` | Client update (unique email ignoring current) |
| `StoreClientFollowupRequest` | Followup creation |
| `UpdateClientFollowupRequest` | Followup update |

**Required followup fields:** `type` (in allowlist: `call,email,whatsapp,linkedin`), `contacted_at` (date). `note` is nullable, `completed` is an optional boolean.

## Query Classes

### ClientIndexQuery

- Pagination (15 per page)
- Status filter, follow-up status filter, contacted-today filter, follow-up date filter, acquisition source filter, text search (name, email, VAT), sorting with column whitelist
- Filter/sort logic lives in a separate `query(): Builder` method (no pagination). `handle()` just calls `query()->paginate(15)`. This split exists so `ClientExcelExporter` can reuse the exact same filtered query for exports without duplicating the `when()` chain

`followups_count` and `followups_max_contacted_at` are constrained to `completed = true`, so the count badge and "last contact" date on each row reflect contacts that actually happened, not scheduled ones. The `followup_status` filter buckets on that same count (`never` = 0, `first_contact` = 1, `second_contact` = 2, `exhausted` = 3+) and restricts to lead/prospect clients.

Both date filters (`contacted_today`, `followup_date`) use `whereHas('followups', ...)` with `whereDate('contacted_at', ...)` scoped to completed follow-ups, and are also limited to lead/prospect.

### ClientFollowupStatsQuery

Feeds the five follow-up stat cards on the index. Counts **lead and prospect clients only** — active and archived clients are out of the pipeline and would distort the funnel.

Groups clients into the same buckets as the `followup_status` filter (`never`, `first_contact`, `second_contact`, `exhausted`) so a card's number and the list you get by clicking through always agree, plus a separate `today` count of clients with a completed follow-up dated today. As everywhere else, only completed follow-ups count.

### ClientShowQuery

Loads related data (projects, tasks, meetings, payments, costs, documents) with eager loading and limit to avoid overfetching. Also returns `payment_tax_estimates` — a `Collection<PaymentTaxEstimate>` keyed by payment id, from `PaymentTaxCalculator::calculateForPayments($payments)` (see [Taxes module](../taxes/backend.md#tax-calculation-engine)) — used by the "Recent Payments" card to show a "set aside" line per payment.

The project ID set used to scope tasks/meetings/payments/costs/documents is **not** just `$client->projects()->pluck('id')` (the direct `client_id` relation) — it also merges in `$client->saasProjects()->pluck('projects.id')`, so a client linked to a SaaS project only through the `client_project` pivot still shows that project (and everything under it) on their show page.

### ClientStatsQuery

Calculates statistics for index stat cards from a single grouped count by status.

Returns: total, count by status, new this month, converted this month, percentages. `total` counts **`active` clients only** — leads aren't converted yet, and archived clients stopped being clients (it previously summed `active + archived`).

**`toFormPayload()` and dates:** `Client` and its siblings (`Project`, `Payment`, `Tax`, `Cost`) format date fields as `Y-m-d` strings in `toFormPayload()` rather than letting `json_encode` serialize the raw `Carbon`. Serializing a date cast produces UTC, and with a non-UTC app timezone local midnight becomes 22:00 of the *previous* day — which made edit modals show a date one day earlier than the saved one.

## Services

### ClientExcelExporter

Located in `app/Services/Clients/ClientExcelExporter.php`. Exports the (filtered) clients list to a downloaded `.xlsx` file.

- Reuses `ClientIndexQuery::query()->get()` — same filters as whatever was active on the index page when the user clicked "Export"
- Built with `phpoffice/phpspreadsheet` (already a project dependency for the Word/Excel document preview feature — no new package added)
- Columns: name, email, phone, status, acquisition source, VAT number, PEC, city, province, website, created at
- **Headers, sheet title, filename, and cell values (status label, acquisition source label) are all resolved through `__()`** using the app's locale — the export is not hardcoded to Italian, it follows whatever language the requesting user has active
- Streamed via `response()->streamDownload()`, no temp file written to disk
