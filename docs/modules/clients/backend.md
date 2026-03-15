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
└── Queries/Clients/
    ├── ClientIndexQuery.php
    ├── ClientShowQuery.php
    └── ClientStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/clients` | index | Paginated client list |
| POST | `/clients` | store | Create new client |
| GET | `/clients/{client}` | show | Client detail |
| PUT | `/clients/{client}` | update | Update client |
| DELETE | `/clients/{client}` | destroy | Soft delete |
| POST | `/clients/{id}/restore` | restore | Restore client |
| DELETE | `/clients/{id}/force-delete` | forceDelete | Permanently delete |
| POST | `/clients/{client}/followups` | followups.store | Create followup |
| PATCH | `/clients/{client}/followups/{followup}` | followups.update | Update followup |
| DELETE | `/clients/{client}/followups/{followup}` | followups.destroy | Delete followup |

## Controllers

### ClientController

Uses the **Query Classes** pattern to keep the controller lean.

- **index()** - Uses `ClientIndexQuery` + `ClientStatsQuery`. Total for stats counts only `active` and `archived` clients (leads excluded).
- **store()** - Validation via `StoreClientRequest`
- **show()** - Uses `ClientShowQuery` to load related data
- **update()** - Supports conditional redirect (returns to show if edited from there)
- **destroy()** - Soft delete
- **restore()** / **forceDelete()** - Recovery and permanent deletion

### ClientFollowupController

Thin controller for lead follow-up CRUD.

- **store()** - `$client->followups()->create($request->validated())`
- **update()** - `$followup->update($request->validated())`
- **destroy()** - `$followup->delete()`

## Models

### Client

Located in `app/Models/Client.php`.

**Features:**
- **SoftDeletes** - Deleted clients are recoverable
- **relationships** - `projects()`, `followups()` (ordered by `contacted_at` desc)
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

Implements `CalendarEventable` — each followup can be added to Google Calendar as an all-day event on `contacted_at`.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `client_id` | FK | Parent client |
| `type` | enum | `call`, `email`, `whatsapp`, `meeting`, `note` |
| `note` | text (nullable) | Free text note |
| `contacted_at` | date | Date of contact |

**Methods:**
- `googleCalendarUrl()` - Returns the Google Calendar pre-filled URL
- `hasCalendarDate()` - Returns `true` if `contacted_at` is set

## Form Requests

| Request | Usage |
|---------|-------|
| `StoreClientRequest` | Client creation (unique email) |
| `UpdateClientRequest` | Client update (unique email ignoring current) |
| `StoreClientFollowupRequest` | Followup creation |
| `UpdateClientFollowupRequest` | Followup update |

**Required followup fields:** `type` (in allowlist), `contacted_at` (date). `note` is nullable.

## Query Classes

### ClientIndexQuery

- Pagination (15 per page)
- Status filter, text search (name, email, VAT), sorting with column whitelist

### ClientShowQuery

Loads related data (projects, tasks, meetings, payments, costs, documents) with eager loading and limit to avoid overfetching.

### ClientStatsQuery

Calculates statistics for index stat cards. Receives `$total` from the controller, which counts only `active + archived` clients — leads are excluded from the total since they are not yet converted clients.

Returns: total, count by status, new this month, converted this month, percentages.
