# Backend

The Invoice module handles PDF generation, manual upload, preview, download, and deletion of invoices associated with payments. It uses a service layer with separate responsibilities: PDF generation, storage management, filename construction, and numbering.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Invoices/
│   │   └── InvoiceController.php
│   └── Requests/Invoices/
│       └── UploadInvoiceRequest.php
└── Services/Invoices/
    ├── InvoiceService.php
    ├── Generators/
    │   ├── InvoicePdfGenerator.php
    │   ├── InvoiceNumberGenerator.php
    │   └── InvoiceFilenameBuilder.php
    └── Storage/
        └── InvoiceStorageManager.php
```

## Routes

All under `auth`, `verified`, `2fa` middleware:

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| POST | `/invoices/payments/{payment}/generate` | `generate` | Generate PDF and download |
| POST | `/invoices/payments/{payment}/upload` | `upload` | Upload manual invoice |
| GET | `/invoices/payments/{payment}/preview` | `preview` | Inline preview |
| GET | `/invoices/payments/{payment}/download` | `download` | File download |
| DELETE | `/invoices/payments/{payment}` | `destroy` | Delete invoice |

## Controller

`InvoiceController` delegates all operations to `InvoiceService`:

- `generate(Payment $payment)` - Generates PDF and downloads it directly (StreamedResponse, not saved to disk)
- `upload(UploadInvoiceRequest $request, Payment $payment)` - Saves uploaded file, updates `invoice_path` on the Payment
- `preview(Payment $payment)` - Opens the file inline in the browser
- `download(Payment $payment)` - Downloads the saved file
- `destroy(Payment $payment)` - Deletes file from storage and resets `invoice_path`

## InvoiceService

Main orchestrator. Coordinates the sub-services:

- `generateAndDownload(Payment $payment)` - Delegates to `InvoicePdfGenerator`
- `upload(Payment $payment, UploadedFile $file)` - Saves via `InvoiceStorageManager`, updates the model
- `download(Payment $payment)` - Retrieves and downloads via `InvoiceStorageManager`
- `preview(Payment $payment)` - Renders inline via `InvoiceStorageManager`
- `delete(Payment $payment)` - Removes file and resets `invoice_path`

## InvoicePdfGenerator

Generates PDF using **Barryvdh/DomPDF**.

### Data Prepared for the Template

| Data | Source |
|------|--------|
| `payment` | Payment model |
| `project` | `payment->project` relationship |
| `client` | `project->client` relationship |
| `business` | `BusinessSettings::current()` |
| `invoice_number` | From `InvoiceNumberGenerator` |
| `invoice_date` | `paid_at` or current date |
| `due_date` | From the Payment |

### PDF Template

The `invoices/pdf.blade.php` template includes 5 partials:

| Partial | Content |
|---------|---------|
| `partials/styles` | CSS (DejaVu Sans font, table-based layout, professional colors) |
| `partials/header` | Business logo, name, invoice number, date |
| `partials/parties` | Left column: business data (name, address, tax ID, VAT number). Right column: client data (name, address, VAT number) or project name fallback |
| `partials/amount` | Formatted amount and due date |
| `partials/description` | Payment notes, amount, payment instructions with IBAN (if configured) |
| `partials/footer` | Currency information |

Paper format: A4.

## InvoiceNumberGenerator

Generates unique invoice numbers.

- **Format**: `{payment_id}/{year}` (e.g., `5/2025`)
- Guarantees uniqueness: payment_id is unique, the year adds temporal context

## InvoiceFilenameBuilder

Builds readable filenames for download.

- **Format**: `invoice-{id_zero_padded}-{year}.{extension}`
- **Example**: `invoice-005-2025.pdf`
- Supported extensions: pdf, jpg, png

## InvoiceStorageManager

Manages the physical storage of invoice files.

- **Storage path**: `storage/app/invoices/`
- **Disk**: Laravel `local`

### Methods

- `saveUploadedFile(UploadedFile $file)` - Saves with timestamp prefix, returns path
- `download(string $path, string $downloadName)` - HTTP download response (attachment)
- `preview(string $path, string $displayName)` - HTTP inline response with correct MIME type
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

`UploadInvoiceRequest`:
- File required
- Formats: pdf, jpg, jpeg, png
- Maximum size: 10MB
- Localized error messages (`__('invoices.*')`)

## Payment Model

Invoice-related fields:
- `invoice_path` - Path to saved file (nullable)
- `hasInvoice()` - Checks if `invoice_path` has a value
- `getInvoiceDownloadUrl()` - Returns download route URL
- `getInvoicePreviewUrl()` - Returns preview route URL

File deletion happens automatically when the Payment is deleted (via model boot).

## Generation vs Upload Flow

### PDF Generation
1. User clicks "Generate"
2. `InvoicePdfGenerator` creates PDF with DomPDF
3. StreamedResponse downloads the file directly
4. The file is NOT saved to disk

### Manual Upload
1. User uploads file via modal
2. File validated by `UploadInvoiceRequest`
3. `InvoiceStorageManager` saves to `storage/app/invoices/`
4. `Payment.invoice_path` updated
5. Redirect to the project's payments tab

## Technical Notes

- PDF generation is on-demand: nothing is saved to disk, it generates and streams.
- Manual upload is the only way to have a persistent file associated with the payment.
- The module does not have its own views for the invoice list: actions are integrated into the payment module views.
