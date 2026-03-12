---
title: Taxes Module Backend - IndieDesk
sidebar_label: Backend
description: Tax payment tracking in Laravel. CRUD for fiscal deadlines, document attachment management, Google Calendar integration and query patterns.
keywords: [Laravel taxes, tax tracking, fiscal deadlines, tax documents, Google Calendar integration, IndieDesk taxes]
---

# Backend

The Taxes module manages tax payment records with a global index (filters + statistics), CRUD operations, document attachment management, and Google Calendar integration for due dates.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Taxes/
│   │   ├── TaxController.php
│   │   └── TaxAttachmentController.php
│   └── Requests/Taxes/
│       ├── StoreTaxRequest.php
│       ├── UpdateTaxRequest.php
│       └── UploadTaxAttachmentRequest.php
├── Models/
│   └── Tax.php
├── Queries/Taxes/
│   ├── TaxIndexQuery.php
│   └── TaxStatsQuery.php
└── Services/Taxes/
    ├── TaxAttachmentService.php
    └── Storage/
        └── TaxAttachmentStorageManager.php
```

## Routes

### Tax CRUD

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| GET | `/taxes` | `taxes.index` | Global paginated tax list with filters |
| POST | `/taxes` | `taxes.store` | Create tax record |
| PUT | `/taxes/{tax}` | `taxes.update` | Update tax record |
| DELETE | `/taxes/{tax}` | `taxes.destroy` | Delete tax record |

### Attachment Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| POST | `/taxes/{tax}/attachment` | `taxes.attachment.upload` | Upload document |
| GET | `/taxes/{tax}/attachment/download` | `taxes.attachment.download` | Download document |
| GET | `/taxes/{tax}/attachment/preview` | `taxes.attachment.preview` | Preview document |
| DELETE | `/taxes/{tax}/attachment` | `taxes.attachment.destroy` | Delete document |

## Controllers

### TaxController

Uses **Query Classes** pattern to separate query/filter logic from the controller.

#### Methods

- **index()** — uses `TaxIndexQuery` for paginated list, `TaxStatsQuery` for stat cards, `getAvailableYears()` for the year select
- **store()** — validates with `StoreTaxRequest`, creates the record and redirects to `taxes.index`
- **update()** — validates with `UpdateTaxRequest`, updates the record and redirects to `taxes.index`
- **destroy()** — deletes the record (model `boot()` handles attachment cleanup) and redirects to `taxes.index`

#### getAvailableYears()

Private helper that returns `range(now()->year, 2026)`. Starts from 2026 (application birth year) and grows automatically each year. Logic lives in the controller, not in the view.

### TaxAttachmentController

Delegates all file operations to `TaxAttachmentService`.

#### Methods

- **upload()** — validates with `UploadTaxAttachmentRequest`, delegates to `TaxAttachmentService::upload()`
- **download()** — returns a `StreamedResponse` via `TaxAttachmentService::download()`
- **preview()** — returns a `BinaryFileResponse` via `TaxAttachmentService::preview()`
- **destroy()** — deletes the file and nullifies `tax.attachment` via `TaxAttachmentService::delete()`

## Model

The `Tax` model is located in `app/Models/Tax.php` and implements `CalendarEventable`.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Tax description |
| `amount` | decimal(10,2) | Tax amount |
| `due_date` | date | Payment deadline |
| `paid_at` | date\|null | Actual payment date (null = unpaid) |
| `reference_year` | smallInteger | Fiscal year the tax refers to |
| `attachment` | string\|null | Local file path of the document |
| `notes` | text\|null | Optional notes |

### Scopes

| Scope | Description |
|-------|-------------|
| `referenceYear($year)` | Filter by reference year |
| `paid()` | Records with `paid_at` not null |
| `unpaid()` | Records with `paid_at` null |

### Helpers

- `hasAttachment()` — returns `true` if a document is attached
- `getAttachmentUploadUrl()` — upload route URL
- `getAttachmentDownloadUrl()` — download route URL (null if no attachment)
- `getAttachmentPreviewUrl()` — preview route URL (null if no attachment)
- `getAttachmentDeleteUrl()` — delete route URL (null if no attachment)
- `toFormPayload()` — safe edit payload (`id` + all fillable fields)
- **Delete hook** — `boot()` deletes the local file when the record is deleted

### CalendarEventable

`Tax` implements the `CalendarEventable` contract:

- `hasCalendarDate()` — returns `true` if `due_date` is set
- `toCalendarEvent()` — returns a `CalendarEvent` DTO (all-day event on due date, title includes date/description/year, body includes all tax details and notes)
- `googleCalendarUrl()` — builds the Google Calendar link via `GoogleCalendarLinkBuilder::fromModel($this)->build()`

## Form Requests

### StoreTaxRequest / UpdateTaxRequest

#### Required Fields

- `description` — string, max 255
- `amount` — numeric, min 0.01, max 999999.99
- `due_date` — date
- `reference_year` — integer, min 2000, max 2100

#### Optional Fields

- `paid_at` — nullable date
- `notes` — nullable string

### UploadTaxAttachmentRequest

- `attachment` — required, file, mimes: `pdf,jpg,jpeg,png`, max 10 MB

## Query Classes

### TaxIndexQuery

Manages the global tax list with:
- pagination (15)
- filters: `reference_year`, `paid` (1 = paid, 0 = unpaid)
- full-text search on `description`
- sorting by `due_date desc`

### TaxStatsQuery

Calculates statistics for the four index stat cards (no currency filter — taxes have no currency field):

| Key | Description |
|-----|-------------|
| `total_all_time` | Sum of all paid taxes |
| `total_this_year` | Sum of taxes paid in the current year |
| `unpaid_amount` | Sum of all unpaid taxes |
| `count_this_year` | Count of taxes with `due_date` in the current year |

## Services

### TaxAttachmentService

Orchestrates file operations:
- **upload()** — deletes existing attachment if present, generates a locale-aware filename, saves via `TaxAttachmentStorageManager`, updates `tax.attachment`
- **download()** / **preview()** — delegates to storage manager after checking file existence
- **delete()** — deletes file and nullifies `tax.attachment`

#### Filename generation

```php
"{$prefix}-{$year}-{$date}-" . time() . ".{$extension}"
// e.g. tax-document-2026-2026-03-11-1741698000.pdf
```

`$prefix` uses `Str::slug(__('taxes.attachment'))` so it is locale-aware and never hardcoded.

### TaxAttachmentStorageManager

Handles low-level Storage disk operations (save, delete, exists, download, preview).
