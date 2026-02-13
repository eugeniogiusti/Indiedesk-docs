---
title: Labels Module Backend - IndieDesk
sidebar_label: Backend
description: Label and tag management system in Laravel. Color-coded labels, document tagging and CRUD operations with service layer patterns.
keywords: [Laravel labels, task labels, project labels, Laravel tags, label management, IndieDesk labels, document tagging]
---

# Backend

The Labels module manages label records (name/color), association with documents, and global CRUD.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Labels/
│   │   └── LabelController.php
│   └── Requests/Labels/
│       ├── StoreLabelRequest.php
│       └── UpdateLabelRequest.php
├── Models/
│   └── Label.php
└── Services/Labels/
    └── LabelService.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/labels` | index | Label management page |
| POST | `/labels` | store | Create label |
| PUT | `/labels/{label}` | update | Update label |
| DELETE | `/labels/{label}` | destroy | Delete label |

## Controller

`LabelController` orchestrates the module and delegates business logic to `LabelService`.

### Methods

- **index()** - loads label list with `LabelService::getAll()`
- **store()** - validates with `StoreLabelRequest` and creates label
- **update()** - validates with `UpdateLabelRequest` and updates label
- **destroy()** - deletes label via service

## Service

`LabelService` encapsulates the module's CRUD operations.

### Main Responsibilities

- **create()** - creates label (`name`, `color`)
- **update()** - updates label and returns the updated record
- **delete()** - first detaches the label from all documents (`detach`), then deletes the record
- **getAll()** - returns labels sorted by name

## Model

The `Label` model is located in `app/Models/Label.php`.

### Features

- **documents relationship** - many-to-many with `Document`
- **`COLORS` constant** - allowed color palette
- **`ordered()` scope** - alphabetical ordering by name
- **`color_hex` accessor** - converts color key to hex
- **`documents_count` accessor** - counts associated documents
- **toFormPayload()** - safe edit payload (`id` + editable fields)

### Supported Colors

`blue`, `green`, `red`, `yellow`, `purple`, `pink`, `indigo`, `orange`

## Form Requests

Validation handled by:

- **StoreLabelRequest** - creation
- **UpdateLabelRequest** - update

### Main Rules

- `name` required, string max 50
- `color` required, must be a valid key in `Label::COLORS`
- `name` unique:
  - store: `unique:labels,name`
  - update: unique with ignore of the current record
