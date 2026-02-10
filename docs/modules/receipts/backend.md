# Backend

The Receipts module handles upload, preview, download, and deletion of receipts associated with costs. Unlike the Invoice module, it does not generate PDFs: it only manages manually uploaded files.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Receipts/
│   │   └── ReceiptController.php
│   └── Requests/Receipts/
│       └── UploadReceiptRequest.php
└── Services/Receipts/
    ├── ReceiptService.php
    └── Storage/
        └── ReceiptStorageManager.php
```

## Routes

All under `auth`, `verified`, `2fa` middleware. Routes are nested under project and cost:

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| POST | `/projects/{project}/costs/{cost}/receipt` | `upload` | Upload receipt |
| GET | `/projects/{project}/costs/{cost}/receipt/download` | `download` | Download file |
| GET | `/projects/{project}/costs/{cost}/receipt/preview` | `preview` | Inline preview |
| DELETE | `/projects/{project}/costs/{cost}/receipt` | `destroy` | Delete receipt |

## Controller

`ReceiptController` delegates all operations to `ReceiptService`:

- `upload(UploadReceiptRequest $request, Project $project, Cost $cost)` - Saves uploaded file
- `download(Project $project, Cost $cost)` - Downloads file
- `preview(Project $project, Cost $cost)` - Opens file inline in browser
- `destroy(Project $project, Cost $cost)` - Deletes file and resets `receipt_path`

## ReceiptService

Module orchestrator. Manages the receipt file lifecycle.

### Methods

- `upload(Cost $cost, UploadedFile $file)` - Generates filename, saves via `ReceiptStorageManager`, updates `Cost.receipt_path`
- `download(Cost $cost)` - Retrieves and downloads file
- `preview(Cost $cost)` - Renders file inline
- `delete(Cost $cost)` - Removes file and resets `receipt_path`
- `ensureReceiptExists(Cost $cost)` - Validates that the receipt exists, otherwise abort 404

### Filename Generation

The `generateFilename()` method creates structured filenames:

- **Format**: `{prefix}-{type}-{date}-{timestamp}.{extension}`
- **Prefix**: Localized string `__('receipts.filename_prefix')`
- **Type**: From the cost type (hosting, api, tool, license, ads, service, travel)
- **Date**: `paid_at` formatted as `YYYY-MM-DD`
- **Timestamp**: Unix timestamp for uniqueness
- **Example**: `receipt-hosting-2025-01-15-1736942400.pdf`

## ReceiptStorageManager

Manages the physical storage of receipt files.

- **Storage path**: `storage/app/receipts/`
- **Disk**: Laravel `local`

### Methods

- `saveUploadedFile(UploadedFile $file, string $filename)` - Saves with `storeAs`, returns path
- `download(string $path, ?string $downloadName)` - HTTP download response (attachment)
- `preview(string $path, ?string $displayName)` - HTTP inline response with correct MIME type
- `delete(?string $path)` - Removes file
- `exists(?string $path)` - Checks existence
- `getMimeType(string $path)` - Returns MIME type (`application/pdf`, `image/jpeg`, `image/png`, fallback `application/octet-stream`)
- `ensureDirectoryExists()` - Creates directory if it does not exist

### Response Headers

**Preview (inline)**:
- `Content-Disposition: inline`
- `X-Content-Type-Options: nosniff`
- `Cache-Control: private, no-store`

**Download (attachment)**:
- `Content-Disposition: attachment`

## Upload Validation

`UploadReceiptRequest`:
- File required
- Formats: pdf, jpg, jpeg, png
- Maximum size: 5MB (half of invoices)
- Localized error messages (`__('receipts.*')`)

## Cost Model

Receipt-related fields:
- `receipt_path` - Path to saved file (nullable)
- `hasReceipt()` - Checks if `receipt_path` has a value
- `getReceiptUploadUrl()` - Returns upload route URL
- `getReceiptDownloadUrl()` - Returns download route URL
- `getReceiptPreviewUrl()` - Returns preview route URL
- `getReceiptDeleteUrl()` - Returns delete route URL

File deletion happens automatically when the Cost is deleted (via model boot).

## Differences from the Invoice Module

| Aspect | Invoice | Receipt |
|--------|---------|---------|
| PDF generation | Yes (DomPDF) | No |
| Manual upload only | No (also generates) | Yes |
| Max size | 10MB | 5MB |
| Storage path | `storage/app/invoices/` | `storage/app/receipts/` |
| Associated with | Payment | Cost |
| Filename | `invoice-{id}-{year}.ext` | `{prefix}-{type}-{date}-{ts}.ext` |
| Route nesting | Flat (`/invoices/payments/{payment}`) | Nested (`/projects/{project}/costs/{cost}/receipt`) |

## Technical Notes

- The module has no automatic generation: it only manages files uploaded by the user.
- The filename includes the cost type, making files identifiable even outside the application.
- Routes are nested under project/cost because receipts are always in the context of a specific project's cost.
- As with invoices, actions are integrated into the cost module views, not in their own views.
