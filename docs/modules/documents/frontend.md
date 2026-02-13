---
title: Documents Module Frontend - IndieDesk
sidebar_label: Frontend
description: Document management UI with Alpine.js upload modal, file preview and Blade partials. Label tagging, table actions and reusable components.
keywords: [Alpine.js upload, document UI, file preview, Blade partials, label tagging, IndieDesk frontend, document management UI, modal forms]
---

# Frontend

The Documents module uses the **Partial Views** pattern to separate the global index and the documents tab of the project show, with a dedicated Alpine modal for upload/edit.

## File Structure

```
resources/views/documents/
├── index.blade.php
├── index/
│   ├── _header.blade.php
│   ├── _stats-cards.blade.php
│   ├── _filters.blade.php
│   ├── _table.blade.php
│   ├── _empty-state.blade.php
│   ├── filters/
│   │   ├── _search.blade.php
│   │   ├── _labels.blade.php
│   │   └── _actions.blade.php
│   ├── stats-cards/
│   │   ├── _total.blade.php
│   │   └── _this-month.blade.php
│   └── document-table/
│       ├── _header.blade.php
│       ├── _row.blade.php
│       ├── _row-project.blade.php
│       ├── _row-name.blade.php
│       ├── _row-labels.blade.php
│       ├── _row-uploaded-at.blade.php
│       └── _row-actions.blade.php
└── partials/
    ├── _document-table.blade.php
    ├── _modal.blade.php
    ├── _form-fields.blade.php
    ├── _file-upload.blade.php
    └── document-table/
        ├── _header.blade.php
        ├── _row.blade.php
        ├── _row-name.blade.php
        ├── _row-labels.blade.php
        ├── _row-uploaded-at.blade.php
        ├── _row-size.blade.php
        └── _row-actions.blade.php

resources/js/components/
└── documentModal.js
```

## Frontend Pattern

### Orchestrator Views

The `documents/index.blade.php` view acts as an orchestrator:
- includes header, statistics, and filters
- chooses table or empty-state based on results

In the project detail, the documents tab uses `projects/show/_tab-documents.blade.php` and includes the reusable table `documents/partials/_document-table.blade.php`.

### Reusable Partials

The module separates the two UI contexts:
- **Global documents index**: partials in `documents/index/*`
- **Documents tab of the project show**: partials in `documents/partials/*`

## Modal (Alpine.js)

### Document Modal

Managed in:
- view: `documents/partials/_modal.blade.php`
- component: `resources/js/components/documentModal.js`

Flow:
- open create with `open-document-modal` event
- open edit with `edit-document` event (record payload)
- submit to route `documents.store` / `documents.update`

Key behaviors:
- the file upload block is visible only in create (`x-show="!isEdit"`)
- the submit button in create requires both `name` and a selected file
- in edit, only metadata/labels are updated
- supports closing with `Esc` and click outside modal

## Form Fields

`documents/partials/_form-fields.blade.php` handles:
- document name (`name`)
- multiple labels (`label_ids[]`)
- notes (`notes`)

`documents/partials/_file-upload.blade.php` handles file input and selected filename display.

## Table Actions

### Global index (`documents/index/document-table/_row-actions.blade.php`)

- view project
- document preview
- document download

### Project tab (`documents/partials/document-table/_row-actions.blade.php`)

- preview
- download
- edit (`edit-document` event with payload from `toFormPayload()`)
- delete (with `data-confirm`)

## Global JS Wiring

Component registration in `resources/js/app.js`:
- `window.documentModal = documentModal`

The global `data-action` listener in `app.js` dispatches the custom events used by the modal.

## Internationalization

Documents frontend strings use:
- `lang/*/documents.php`
- `lang/*/ui.php`

Label badge rendering uses the `x-documents.label-badge` Blade component.

## Dark Mode

The module supports dark mode via Tailwind `dark:*` classes, consistent with the application layout.
