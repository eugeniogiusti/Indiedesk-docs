---
title: Company Module Backend - IndieDesk
sidebar_label: Backend
description: Business settings and company profile management in Laravel. Singleton pattern, logo upload, tax data and currency configuration.
keywords: [Laravel company settings, business profile, company management, Laravel settings, singleton pattern, IndieDesk company, profile management]
---

# Backend

The Company module corresponds to **Business Settings**: company profile, tax/contact data, default currency, and logo.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Settings/
│   │   └── BusinessSettingsController.php
│   └── Requests/Settings/
│       └── UpdateBusinessSettingsRequest.php
├── Models/
│   └── BusinessSettings.php
└── Services/Settings/
    └── BusinessSettingsService.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/settings/business` | settings.business.edit | Business settings form |
| PUT | `/settings/business` | settings.business.update | Save updates |
| DELETE | `/settings/business/logo` | settings.business.delete-logo | Delete logo |

The Integrations tab also hosts the Google Calendar connection, whose routes live in the same `settings` prefix but belong to the [Calendar module](../calendar/backend.md#authentication) (`GoogleCalendarSettingsController`).

## Controller

`BusinessSettingsController` orchestrates the module and delegates application logic to the service.

### Methods

- **edit()** - loads settings with `BusinessSettings::current()` plus `GoogleCalendarSettings::current()` (passed to the view as `$googleCalendar` so the Integrations tab can show the connected/disconnected state) and renders `settings.business`
- **update()** - validates with `UpdateBusinessSettingsRequest`, delegates update to the service, and maintains the active tab with `_active_tab`
- **deleteLogo()** - delegates logo deletion to the service and redirects to the `business` tab

## Service

`BusinessSettingsService` encapsulates update and logo file management.

### Main Responsibilities

- **update()**
  - retrieves the `BusinessSettings::current()` singleton
  - handles logo upload separately
  - updates the record with validated data

- **handleLogoUpload()** (private)
  - deletes old logo if present
  - saves new file to `local` disk in the `business/` folder

- **deleteLogo()**
  - deletes logo file from storage
  - resets `logo_path` in the record

## Model

The `BusinessSettings` model represents a singleton application configuration.

### Features

- **Table**: `business_settings`
- **Singleton**: `current()` uses static cache to avoid repeated queries and creates a record with `id=1` if missing
- **`CURRENCIES` constant**: maps currency codes -> symbol
- **Accessors**:
  - `logo_url` (temporary URL local storage)
  - `owner_full_name`
  - `formatted_address`

### Main Fields

- owner data: `owner_first_name`, `owner_last_name`
- legal address: `legal_*`
- tax: `tax_id`, `vat_number`, `iban`, `default_currency`
- contacts: `email`, `certified_email`, `phone_*`
- business: `business_name`, `business_description`, `website`, `logo_path`
- integrations: `github_pat`, `billing_tool_url` (Google Calendar tokens live in their own `google_calendar_settings` singleton, not here — they're rotated by the refresh flow and shouldn't ride along with a user-submitted settings form)
- fiscal regime: `tax_regime`, `profitability_coefficient`, `substitute_tax_rate`, `annual_revenue_cap`, `business_start_date`, **`inps_rate`, `inps_ceiling`** (nullable — see below)

`profitability_coefficient`, `inps_rate`, and `substitute_tax_rate` feed the tax estimation engine (`PaymentTaxCalculator`, see the [Taxes module](../taxes/backend.md#tax-calculation-engine)). All three are nullable with **no default value** — if any is left empty, no tax estimate is shown anywhere in the app rather than falling back to a guessed rate. `inps_ceiling` (annual INPS contribution cap) is optional; when set, it caps the cumulative INPS base for the year.

## Form Request

`UpdateBusinessSettingsRequest` centralizes update validation.

### Main Rules

- text fields with `max` limits
- `legal_province` and `legal_country` with fixed length (`size:2`)
- `default_currency` `size:3`
- `email` / `certified_email` in email format
- `website` valid URL
- `iban` with dedicated regex
- `logo` image, max 2MB, formats `jpeg,jpg,png,svg`

### Custom Messages

Managed for specific errors on `logo` and `iban` format via `business_settings.*` keys.

## Architectural Notes

- The module is used across other contexts (e.g., currency symbol in PDF/statistics, default currency in forms).
- File persistence logic is kept in the service; the controller remains an orchestrator.
