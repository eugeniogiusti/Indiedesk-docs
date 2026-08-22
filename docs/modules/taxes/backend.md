---
title: Taxes Module Backend - IndieDesk
sidebar_label: Backend
description: Tax payment tracking, regime forfettario tax estimation engine and tax savings account tracker in Laravel. CRUD, document attachments, Google Calendar integration.
keywords: [Laravel taxes, tax tracking, regime forfettario, INPS gestione separata, imposta sostitutiva, tax estimation, fiscal deadlines, tax documents, Google Calendar integration, IndieDesk taxes]
---

# Backend

The Taxes module manages tax payment records with a global index (filters + statistics), CRUD operations, document attachment management, Google Calendar integration for due dates, and — since the tax estimation feature — the fiscal calculation engine and the tax savings account tracker used across the app.

:::warning Italian "Regime Forfettario" only
The tax estimation engine (`PaymentTaxCalculator`) hardcodes the calculation rules of the Italian **regime forfettario**: a flat profitability coefficient applied to gross income, INPS Gestione Separata contributions on the resulting taxable base, and an imposta sostitutiva computed on that base net of INPS. It is **not** a general-purpose tax engine — it doesn't support regime ordinario, regime dei minimi, VAT-based regimes, or any non-Italian tax system. All rates are configurable (`BusinessSettings`), but the *formula/shape* of the calculation is not. Supporting a different regime requires dedicated development, not a config change.
:::

## File Structure

```
app/
├── Http/
│   ├── Controllers/Taxes/
│   │   ├── TaxController.php
│   │   ├── TaxAttachmentController.php
│   │   └── TaxFundMovementController.php
│   └── Requests/Taxes/
│       ├── StoreTaxRequest.php
│       ├── UpdateTaxRequest.php
│       ├── UploadTaxAttachmentRequest.php
│       └── StoreTaxFundMovementRequest.php
├── Models/
│   ├── Tax.php
│   └── TaxFundMovement.php
├── Queries/Taxes/
│   ├── TaxIndexQuery.php
│   └── TaxStatsQuery.php
└── Services/Taxes/
    ├── TaxAttachmentService.php
    ├── PaymentTaxCalculator.php
    ├── TaxFundService.php
    ├── DTO/
    │   └── PaymentTaxEstimate.php
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

### Tax Fund Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| POST | `/tax-fund-movements` | `tax-fund-movements.store` | Register a manual deposit/withdrawal |
| DELETE | `/tax-fund-movements/{taxFundMovement}` | `tax-fund-movements.destroy` | Delete a manual movement (blocked for auto-generated ones, see below) |

Both redirect back to `statistics.index`, where the Tax Fund card lives.

## Controllers

### TaxController

Uses **Query Classes** pattern to separate query/filter logic from the controller.

#### Methods

- **index()** — uses `TaxIndexQuery` for paginated list, `TaxStatsQuery` for stat cards, `getAvailableYears()` for the year select
- **store()** — validates with `StoreTaxRequest`, creates the record, then calls `TaxFundService::syncFromTax($tax)` (injected via constructor), and redirects to `taxes.index`
- **update()** — validates with `UpdateTaxRequest`, updates the record, then calls `TaxFundService::syncFromTax($tax)`, and redirects to `taxes.index`
- **destroy()** — deletes the record (model `boot()` handles attachment cleanup; the `tax_id` foreign key on `tax_fund_movements` cascades the delete, see [Tax Fund](#tax-fund)) and redirects to `taxes.index`

#### getAvailableYears()

Private helper that returns `range(now()->year, 2026)`. Starts from 2026 (application birth year) and grows automatically each year. Logic lives in the controller, not in the view.

### TaxAttachmentController

Delegates all file operations to `TaxAttachmentService`.

#### Methods

- **upload()** — validates with `UploadTaxAttachmentRequest`, delegates to `TaxAttachmentService::upload()`
- **download()** — returns a `StreamedResponse` via `TaxAttachmentService::download()`
- **preview()** — returns a `BinaryFileResponse` via `TaxAttachmentService::preview()`
- **destroy()** — deletes the file and nullifies `tax.attachment` via `TaxAttachmentService::delete()`

### TaxFundMovementController

Manages manual deposits/withdrawals on the tax savings account.

#### Methods

- **store()** — validates with `StoreTaxFundMovementRequest` (`date`, `amount` positive, `type` in `deposit`/`withdrawal`, optional `notes`), creates a `TaxFundMovement` with `amount = $request->signedAmount()` (the request flips the sign for withdrawals so the model only ever stores a signed amount)
- **destroy()** — if `$taxFundMovement->tax_id` is set (auto-generated from a paid `Tax`), redirects back with a `session('error')` instead of deleting — those movements can only be removed by unmarking the source `Tax` as unpaid, to keep the two in sync. Otherwise deletes normally.

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
- `toCalendarEvent()` — returns a `CalendarEvent` DTO (all-day event on due date, title includes date/description/year, body includes all tax details and notes). Once `paid_at` is set the title gains a `✅` prefix and the body a `Paid at` line, so a settled deadline reads as done straight from the calendar
- `calendarTitleBody()` — the title without the paid marker, used by the sync to recognise an event it already created
- `googleCalendarUrl()` — builds the Google Calendar link via `GoogleCalendarLinkBuilder::fromModel($this)->build()`

Tax deadlines also **sync automatically** to Google Calendar when the integration is connected: `TaxController` injects `GoogleCalendarSync` and syncs on create/update (including when the record is marked paid, which just goes through the normal update form) and removes the event on delete. The link between record and event is the nullable `google_event_id` column. See the [Calendar module](../calendar/backend.md#automatic-sync).

:::warning
`Tax` is one of the six models bound by `CalendarEventable`. When the contract gains a method, this model must be updated with the others — a missing method makes the class unloadable and 500s `/taxes` **and** `/statistics`, which both reference it.
:::

## Tax Calculation Engine

`PaymentTaxCalculator` (`app/Services/Taxes/PaymentTaxCalculator.php`) estimates INPS (Gestione Separata) contributions and imposta sostitutiva on paid `Payment` records, for a regime forfettario freelancer. See the [regime forfettario warning](#backend) at the top of this page — the formula is not configurable, only the rates are.

### Configuration source

Rates come from the `BusinessSettings` singleton (see the [Company module](../company/backend.md)): `profitability_coefficient`, `inps_rate`, `substitute_tax_rate`, and optional `inps_ceiling`. `isConfigured()` checks the three required rates are non-null — **if any is missing, no estimate is produced at all** (never a guessed/default value). This is intentional: the app ships with no hardcoded fallback rates.

### Why the calculation is progressive, not per-payment

Both INPS and imposta sostitutiva apply to the **cumulative** taxable income of the fiscal year (cash basis), not to each payment in isolation:
- INPS because of the annual contribution ceiling (`inps_ceiling`, optional)
- imposta sostitutiva because its base is the cumulative taxable income **net of the INPS due so far**

So each payment's quota is derived by difference: `(progressive total up to and including this payment) − (progressive total before it)`.

### `calculateForPayments(Collection $payments): Collection<PaymentTaxEstimate>`

Given any collection of payments, groups them by fiscal year (`paid_at->year`) and, for **each year found**, re-queries **all** paid payments of that year — not just the ones passed in, since INPS/tax are due on the freelancer's whole income regardless of which project or client a payment belongs to. Iterates chronologically (`paid_at`, then `id` as tiebreaker) accumulating the running taxable total, then returns a `PaymentTaxEstimate` per payment, keyed by payment id (only for the ids that were actually requested).

Filtered by `BusinessSettings::current()->default_currency` — payments in another currency are excluded from the cumulative base (no exchange-rate conversion) and get no estimate.

`calculateForPayment(Payment $payment): ?PaymentTaxEstimate` is a convenience wrapper around the above for a single payment.

### PaymentTaxEstimate (DTO)

`app/Services/Taxes/DTO/PaymentTaxEstimate.php` — readonly value object: `grossAmount`, `taxableIncome`, `inpsAmount`, `taxAmount`, plus `setAsideAmount()` (INPS + tax) and `netAmount()` (gross − setAsideAmount).

### Where it's used

| Caller | Purpose |
|--------|---------|
| `ProjectShowQuery` | Per-payment estimate on the project show "Payments" tab |
| `PaymentController::index()` / `PaymentStatsQuery` | Per-payment estimate + "this year"/"this month" totals on the global payments index |
| `ClientShowQuery` | Per-payment estimate on the client show "Recent Payments" list |
| `DashboardStatsQuery` / `DashboardListsQuery` | Net profit this month + per-payment estimate on "Recent Payments" |
| `FinancialStatsQuery`, `MonthlyBreakdownQuery`, `MonthlyDetailQuery` (Statistics module) | Period/monthly net profit and estimated tax |
| `TaxFundService` | This year's total due, for the Tax Fund comparison (see below) |

None of these callers duplicate the algorithm — they all call `calculateForPayments()`/`calculateForPayment()` and read the resulting `PaymentTaxEstimate`(s).

## Tax Fund

Tracks the balance of the freelancer's dedicated tax savings account and compares it against the current year's estimated tax liability, so the UI (Tax Fund card in Statistics, see the [stats frontend docs](../stats/frontend.md)) can show whether they're covered or short.

### TaxFundMovement (model)

`app/Models/TaxFundMovement.php` — a single deposit or withdrawal. Table `tax_fund_movements`.

| Field | Type | Description |
|-------|------|-------------|
| `tax_id` | FK, nullable | Set when the movement was auto-generated from a paid `Tax` (see below); null for manual entries |
| `date` | date | When the movement happened |
| `amount` | decimal(10,2) | **Signed**: positive = deposit, negative = withdrawal |
| `notes` | string, nullable | Free text |

The account balance is simply `TaxFundMovement::sum('amount')` — no separate running-balance column.

### TaxFundService

`app/Services/Taxes/TaxFundService.php`:

| Method | Returns | Description |
|--------|---------|-------------|
| `balance()` | `float` | Sum of all movements |
| `dueThisYear()` | `?float` | INPS + tax estimated on **this calendar year's** paid payments so far (via `PaymentTaxCalculator`), null if rates aren't configured. Always the real current year — independent of any year/month filter selected elsewhere in the UI, since this answers "am I covered right now", not a historical report |
| `paidThisYear()` | `float` | Sum of `Tax::paid()->referenceYear(now()->year)`. Filtered by **`reference_year`, not `paid_at`** — a tax paid late, out of pocket, for a *past* year's liability must never net against the current year's target |
| `remainingDue()` | `?float` | `dueThisYear() - paidThisYear()`, floored at 0 |
| `difference()` | `?float` | `balance() - remainingDue()`. Positive = surplus, negative = shortfall |
| `syncFromTax(Tax $tax)` | `void` | Keeps the auto-generated movement in sync with a `Tax`'s paid state (see below) |

### Auto-sync with the Taxes module

`TaxController::store()`/`update()` call `TaxFundService::syncFromTax($tax)` after every save:

- if the tax has both `paid_at` and `amount` set → `TaxFundMovement::updateOrCreate(['tax_id' => $tax->id], [...])` with `amount = -abs($tax->amount)` (always a withdrawal), `date = $tax->paid_at`, `notes` auto-filled with the tax description
- otherwise (unpaid, or amount cleared) → deletes any existing movement for that `tax_id`

Deleting the `Tax` itself cascades to the movement via the `tax_id` foreign key (`cascadeOnDelete()`), no explicit cleanup code needed in `TaxController::destroy()`.

This means paying a tax bill from the app (`/taxes`) automatically reflects on the Tax Fund balance — no double data entry. Auto-generated movements are marked in the UI and can't be deleted directly (see [TaxFundMovementController](#taxfundmovementcontroller)); removing one means unmarking the source `Tax` as unpaid.

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

### StoreTaxFundMovementRequest

- `date` — required, date
- `amount` — required, numeric, min 0.01 (always positive — the sign is decided by `type`)
- `type` — required, `in:deposit,withdrawal`
- `notes` — nullable string, max 255

Exposes `signedAmount()`: returns `$amount` as-is for `deposit`, negated for `withdrawal`. The controller stores this directly on `TaxFundMovement::amount`.

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
