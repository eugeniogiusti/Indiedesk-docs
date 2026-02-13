---
title: Company Module Frontend - IndieDesk
sidebar_label: Frontend
description: Business settings UI with Alpine.js tabs, logo management and Blade form components. Sectioned forms with dark mode support.
keywords: [Alpine.js tabs, settings UI, Blade components, form sections, logo upload, IndieDesk frontend, settings page, tab navigation]
---

# Frontend

The Company module uses a settings page with a single form and Alpine internal tabs to section the fields.

## File Structure

```
resources/views/settings/
├── business.blade.php
└── business/
    ├── _header.blade.php
    ├── _tabs-container.blade.php
    ├── _tabs-navigation.blade.php
    ├── _personal-info.blade.php
    ├── _legal-address.blade.php
    ├── _tax-info.blade.php
    ├── _contacts.blade.php
    ├── _business-info.blade.php
    └── _actions.blade.php
```

## Frontend Pattern

### Orchestrator View

`resources/views/settings/business.blade.php`:
- includes header
- contains the main form `PUT settings.business.update`
- includes `_tabs-container` with all sections
- contains a separate hidden form for `DELETE settings.business.delete-logo`

### Alpine Inline Tabs

`_tabs-container.blade.php` manages tab state with:
- `x-data="{ activeTab: ... }"`
- hidden input `_active_tab` populated by `activeTab`
- `x-show` + `x-cloak` for section content

`_tabs-navigation.blade.php`:
- tab switch via `@click="activeTab = '...'"`
- also updates `window.location.hash` for UX

Available tabs:
- `personal`
- `legal`
- `tax`
- `contacts`
- `business`

## Form Sections

The content partials use Blade form components (`x-form-input`, `x-form-textarea`) and separate responsibilities:

- `_personal-info`: owner first/last name
- `_legal-address`: complete legal address
- `_tax-info`: tax/vat + default currency (select from `BusinessSettings::CURRENCIES`)
- `_contacts`: email, certified email, phone
- `_business-info`: business name/description, website, IBAN, logo

`_actions.blade.php` contains the form submit.

## Logo Management

In `_business-info.blade.php`:
- shows logo preview if `logo_path` is present (`$settings->logo_url`)
- supports logo deletion via submit of the hidden `delete-logo-form`
- file input with client-side validations (`accept`) consistent with the backend

## Navigation

The module link is in the settings sidebar:
- `resources/views/layouts/sidebar/_nav-settings.blade.php`
- route `settings.business.edit`

## Internationalization

UI strings primarily use:
- `lang/*/business_settings.php`

## Dark Mode

All partials are compatible with Tailwind `dark:*` classes.
