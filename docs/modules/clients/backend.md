---
title: Clients Module Backend - IndieDesk
sidebar_label: Backend
description: Client registry management in Laravel with soft delete, filters, search and statistics. Query classes pattern and CRUD operations.
keywords: [Laravel clients, client management, soft delete, Laravel CRM, client registry, IndieDesk clients]
---

# Backend

The Clients module manages the client registry with support for soft delete, filters, search, and statistics.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Clients/
│   │   └── ClientController.php
│   └── Requests/Clients/
│       ├── StoreClientRequest.php
│       └── UpdateClientRequest.php
├── Models/
│   └── Client.php
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

## Controller

The `ClientController` uses the **Query Classes** pattern to keep the controller lean. Query logic is delegated to dedicated classes in `app/Queries/Clients/`.

### Methods

- **index()** - Uses `ClientIndexQuery` for the paginated list and `ClientStatsQuery` for statistics
- **store()** - Validation via `StoreClientRequest`
- **show()** - Uses `ClientShowQuery` to load related data (projects, tasks, meetings, etc.)
- **update()** - Supports conditional redirect (returns to show if edited from there)
- **destroy()** - Soft delete
- **restore()** - Restores a deleted client
- **forceDelete()** - Permanent deletion

## Model

The `Client` model is located in `app/Models/Client.php`.

### Features

- **SoftDeletes** - Deleted clients are recoverable
- **projects relationship** - A client has many projects
- **Scopes** - `active()`, `leads()`, `archived()` to filter by status
- **toFormPayload()** - Method that returns only `id` + `$fillable` fields for edit forms, avoiding exposure of sensitive data on the frontend

### Client Statuses

| Status | Description |
|--------|-------------|
| `lead` | Potential client |
| `active` | Active client |
| `archived` | Archived client |

### Fields

Fields include personal data, contacts, billing, and web information.
Validation is handled via dedicated Form Requests.

## Form Requests

Validation is handled by dedicated Form Requests:

- **StoreClientRequest** - Creation validation (unique email)
- **UpdateClientRequest** - Update validation (unique email ignoring current record)

### Required Fields

- `name` - Client name
- `email` - Email (unique)
- `status` - Status (lead/active/archived)

### Optional Fields

All other fields (contacts, billing, web) are optional with specific validation (e.g., `billing_country` must be a 2-character ISO code).

## Query Classes

The template uses the **Query Classes** pattern to separate query logic from the controller.

### ClientIndexQuery

Manages the client list with:
- **Pagination** (15 items per page)
- **Status filter** - `?status=active`
- **Text search** - `?search=mario` (searches in name, email, VAT number)
- **Sorting** - `?sort_by=name&sort_direction=asc`
- **Column whitelist** - Only allowed columns to prevent SQL injection

### ClientShowQuery

ClientShowQuery loads the client's main related data
(projects, tasks, meetings, payments, costs, documents),
using eager loading and limits to avoid overfetching.

### ClientStatsQuery

Calculates statistics for the index page cards:
- Total clients
- Count by status
- New clients this month
- Converted clients this month
- Percentages
