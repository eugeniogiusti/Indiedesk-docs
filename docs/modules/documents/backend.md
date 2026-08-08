---
title: Documents Module Backend - IndieDesk
sidebar_label: Backend
description: Document management system in Laravel. File upload, storage, metadata, label tagging and preview patterns with query classes.
keywords: [Laravel documents, document management, file storage, Laravel storage, file upload, IndieDesk documents, document tagging]
---

# Backend

The Documents module handles file upload, metadata, label tagging, file download/preview, and CRUD within the project context, with a filterable global index.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Documents/
│   │   └── DocumentController.php
│   └── Requests/Documents/
│       ├── StoreDocumentRequest.php
│       └── UpdateDocumentRequest.php
├── Models/
│   └── Document.php
├── Queries/Documents/
│   ├── DocumentIndexQuery.php
│   └── DocumentStatsQuery.php
└── Services/Documents/
    ├── DocumentService.php
    └── OfficeDocumentConverter.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/documents` | index | Global paginated document list with filters |
| POST | `/projects/{project}/documents` | store | Upload new document to the project |
| PUT | `/projects/{project}/documents/{document}` | update | Update document metadata/labels |
| DELETE | `/projects/{project}/documents/{document}` | destroy | Delete document and file |
| GET | `/projects/{project}/documents/{document}/download` | download | File download |
| GET | `/projects/{project}/documents/{document}/preview` | preview | Inline file preview |

## Controller

The `DocumentController` orchestrates the flow and delegates storage logic to `DocumentService`.

### Methods

- **index()** - Uses `DocumentIndexQuery` for paginated list and `DocumentStatsQuery` for statistics cards
- **store()** - Validates with `StoreDocumentRequest`, delegates upload to `DocumentService::upload()` and redirects to `projects.show?tab=documents`
- **update()** - Validates with `UpdateDocumentRequest`, delegates update to `DocumentService::update()`
- **destroy()** - Delegates deletion to `DocumentService::delete()`
- **download()** - Delegates file download to `DocumentService::download()`
- **preview()** - Delegates inline preview to `DocumentService::preview()`

## Service

`DocumentService` encapsulates the module's file-system logic.

### Main Responsibilities

- **upload()** - generates a unique filename, saves file to `local/documents` disk, creates document record, and syncs labels
- **update()** - updates only metadata (`name`, `notes`) and syncs labels
- **delete()** - deletes physical file (if present), also purges any cached PDF preview via `OfficeDocumentConverter::forgetPreview()`, then the DB record
- **download()** - verifies file existence and returns a download response with the document name
- **preview()** - verifies file existence, resolves the best previewable version via `OfficeDocumentConverter::resolvePreview()` (converts Word/Excel to PDF on the fly, cached — see below), and returns an inline response with secure headers

## OfficeDocumentConverter

Located in `app/Services/Documents/OfficeDocumentConverter.php`. Converts `.docx` and `.xlsx`/`.xls` uploads to PDF so they render inline in the browser the same way a native PDF does — previously these formats just fell back to a browser download since browsers can't render Office formats natively.

- **Pure PHP, no external binary** — uses `phpoffice/phpword` (Word → PDF) and `phpoffice/phpspreadsheet` (Excel → PDF), both rendered through Dompdf (already a project dependency for invoice/tax PDF generation). Deliberately **not** a LibreOffice-headless shell-out: no server-side binary to install/maintain, at the cost of lower fidelity than LibreOffice for complex layouts
- **`resolvePreview(string $absolutePath, string $extension): array`** — returns `{path, mimeType, extension}`. If the extension is convertible and conversion succeeds, returns the converted PDF; otherwise falls back to the original file (graceful degradation — a failed/unsupported conversion never breaks the preview, it just behaves like before)
- **Cached** — converted PDFs are written once to `storage/app/previews/`, keyed by the original (already-unique) stored filename, so a document is only converted the first time it's previewed
- **`forgetPreview()`** — called from `DocumentService::delete()` (and the equivalent in `TaskDocumentService`/`BusinessDocumentService`) so cached PDFs don't outlive the document they belong to
- **Legacy `.doc`/`.xls` (binary formats)**: `.xls` converts fine (PhpSpreadsheet reads the legacy binary format); `.doc` does not — PHPWord has no reliable Word97 binary reader, so old `.doc` files are still accepted for upload/download but fall back to raw download for preview, same as before
- **Not supported: PowerPoint** — `.ppt`/`.pptx` are not accepted for upload at all; the PHPOffice equivalent library for PDF export from presentations was evaluated and found unreliable, so it was deliberately left out rather than shipped half-working
- Shared by three upload contexts with the same file lifecycle: **project Documents** (this module), **Task Documents**, and **Business Documents** (settings) — see their respective docs for the upload/preview wiring, the conversion logic itself lives only here

## Model

The `Document` model is located in `app/Models/Document.php`.

### Features

- **project relationship** - each document belongs to a project
- **labels relationship** - many-to-many with `Label` via `document_label` pivot
- **Scopes** - `forProject()`, `withLabel()`, `search()`, `recent()`
- **File helpers** - `file_size` (accessor), `file_extension` (accessor)
- **URL helpers** - `getDownloadUrl()`, `getPreviewUrl()`, `getDeleteUrl()`, `getUpdateUrl()`
- **toFormPayload()** - edit payload (`id` + editable fields + `label_ids`)

## Form Requests

Validation handled by:

- **StoreDocumentRequest** - document creation/upload
- **UpdateDocumentRequest** - document metadata update

### Required Fields (store)

- `name` - document name
- `file` - required file (`mimes:pdf,jpg,jpeg,png,webp,zip,7z,rar,doc,docx,xls,xlsx`, max 30MB). Word/Excel formats were added alongside `OfficeDocumentConverter` (see above) — before that they weren't accepted at all

### Required Fields (update)

- `name` - document name

### Optional Fields

- `label_ids` - label array (`exists:labels,id`)
- `notes` - notes (`max:1000`)

## Query Classes

The module uses Query Classes to keep query logic out of the controller.

### DocumentIndexQuery

Manages the global document list with:
- eager loading `project`, `labels`
- filter by label (`label_id`)
- text search (`search`) on document/project name
- recent sorting (`uploaded_at desc` via `recent()` scope)
- pagination (20)

### DocumentStatsQuery

Calculates statistics for the index:
- `this_month` - documents uploaded in the current month
- `by_label` - top labels by document count (max 5)
