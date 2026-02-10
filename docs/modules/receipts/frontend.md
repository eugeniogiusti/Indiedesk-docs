# Frontend

The Receipts module does not have its own views: receipt actions are integrated into the cost module views via components, partials, and an upload modal.

## File Structure

```
resources/views/
├── costs/
│   ├── partials/
│   │   ├── _upload-receipt-modal.blade.php
│   │   └── cost-table/
│   │       └── _row-receipt.blade.php
│   └── index/
│       └── cost-table/
│           └── _row-receipt.blade.php
└── components/costs/
    └── receipt-actions-readonly.blade.php
```

## Receipt Upload Modal

`costs/partials/_upload-receipt-modal.blade.php`

- Alpine.js component: `receiptUploadModal(projectId)`
- Open event: `@upload-receipt.window`
- **Drag-and-drop** support for file input
- File input: accepts PDF, JPG, JPEG, PNG
- Shows selected filename
- Submit button disabled until a file is selected
- Dynamic form action based on cost ID

## Cost Table Columns

Two partials for showing receipt status in cost tables:

### Project show (`costs/partials/cost-table/_row-receipt.blade.php`)
- If receipt exists: preview + download link, delete button
- If receipt does not exist: "Not set" badge
- Upload button always visible
- Full CRUD (preview, download, delete, upload)

### Costs index (`costs/index/cost-table/_row-receipt.blade.php`)
- If receipt exists: preview + download link
- If receipt does not exist: "Not set" badge
- Same actions as the project show

## Receipt Actions Readonly Component

`components/costs/receipt-actions-readonly.blade.php`

Read-only version of receipt actions, used on the index page:

- If receipt exists:
  - **Preview** button (eye icon, purple)
  - **Download** button (down arrow icon, green)
- If receipt does not exist:
  - "Not set" badge
- No delete button (read-only mode)

## Differences from the Invoice Frontend

| Aspect | Invoice | Receipt |
|--------|---------|---------|
| Drag-and-drop | No | Yes |
| Generate button | Yes (generates PDF) | No (upload only) |
| Readonly component | No | Yes (`receipt-actions-readonly`) |
| Action colors | Blue | Purple (preview), green (download) |

## Technical Notes

- Drag-and-drop is implemented with Alpine.js, no external libraries.
- The modal receives the `projectId` as a parameter to build nested route URLs.
- Actions are contextual: in the project show there is full CRUD, in the index there is read-only access.
- Preview and download open/download the file directly from the server.
