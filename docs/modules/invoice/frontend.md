# Frontend

The Invoice module does not have its own dedicated views (index/show): invoice actions are integrated into the payment module views via components and partials.

## File Structure

```
resources/views/
├── invoices/
│   ├── pdf.blade.php
│   └── partials/
│       ├── styles.blade.php
│       ├── header.blade.php
│       ├── parties.blade.php
│       ├── amount.blade.php
│       ├── description.blade.php
│       └── footer.blade.php
├── payments/
│   ├── partials/
│   │   ├── _upload-invoice-modal.blade.php
│   │   └── payment-table/
│   │       └── _row-invoice.blade.php
│   └── index/
│       └── payment-table/
│           └── _row-invoice.blade.php
└── components/payments/
    └── invoice-actions.blade.php
```

## Invoice Actions Component

`components/payments/invoice-actions.blade.php` - Blade component that shows invoice actions based on state.

### If the invoice exists (`$payment->hasInvoice()`)

- Badge with invoice number
- **Preview** button (eye icon, blue) - opens inline in browser
- **Download** button (down arrow icon, blue) - downloads file
- **Delete** button (trash icon, red) - deletes invoice

### If the invoice does not exist

- **Generate** button (document icon, blue) - POST to `invoices.generate` route, generates and downloads PDF
- **Upload** button (upload icon, gray) - opens upload modal

## Invoice Upload Modal

`payments/partials/_upload-invoice-modal.blade.php`

- Alpine.js component: `uploadInvoiceModal()`
- Open event: `@open-upload-modal.window`
- Dynamic form action based on payment ID
- File input: accepts only PDF
- Maximum size hint: 10MB
- Button states: normal/submit

## Payment Table Columns

Two partials for showing invoice status in payment tables:

- `payments/partials/payment-table/_row-invoice.blade.php` - Used in the project show (payments tab)
- `payments/index/payment-table/_row-invoice.blade.php` - Used in the payments index page

Both show:
- If invoice exists: preview + download link
- If invoice does not exist: generate form + upload button
- Actions: preview, download, delete (or generate if none exists)

## PDF Template

`invoices/pdf.blade.php` is the template used by DomPDF to generate the invoice PDF. It is not a web view, but an HTML template optimized for PDF conversion.

### Structure

The template includes 5 partials from the `invoices/partials/` subfolder:

1. **styles** - Inline CSS for PDF: DejaVu Sans font (safe for Unicode/PDF), table-based layout, professional gray/black colors, 40px padding
2. **header** - Business logo (if configured), business name, invoice number (`Invoice #{number}`), invoice date
3. **parties** - Two columns: left side business data (owner name, legal address, tax ID, VAT number), right side client data (name, billing address, VAT number) with fallback to project name if no client
4. **amount** - Formatted amount with currency symbol, due date if present
5. **description** - Payment notes (or default "Payment" text), amount on the right, payment instructions with IBAN in a styled box (if configured in BusinessSettings)
6. **footer** - Information about the currency used

## Technical Notes

- The module does not have its own pages: all interactions happen inside the payment views.
- Upload uses Alpine.js for modal management, no other dedicated JS.
- The PDF template uses inline CSS and table-based layout for maximum DomPDF compatibility.
- Preview and download use HTTP responses with appropriate headers (inline vs attachment).
