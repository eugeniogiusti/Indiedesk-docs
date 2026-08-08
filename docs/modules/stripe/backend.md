---
title: Stripe Integration Backend - IndieDesk
sidebar_label: Backend
description: Automatic payment recording from your own SaaS products via Stripe webhooks. Product-metadata project routing, client matching/creation, idempotent Payment creation.
keywords: [Stripe webhooks, Stripe integration Laravel, invoice.paid, payment automation, IndieDesk Stripe, SaaS billing sync]
---

# Backend

The Stripe integration turns `invoice.paid` webhook events from your own SaaS products into `Payment` records in IndieDesk automatically — no manual entry. It's a cross-cutting integration, not a standalone CRUD module: it writes to `clients`, `client_project` and `payments`, all owned by their respective modules (Clients, Projects, Payments).

This only concerns payments coming from **your own SaaS products**, billed through your own Stripe account. It has nothing to do with donations, one-off Payment Links, or any other unrelated use of Stripe.

## File Structure

```
app/
├── Http/Controllers/Webhooks/
│   └── StripeWebhookController.php
└── Services/Stripe/
    └── StripeWebhookHandler.php

database/migrations/
└── 2026_08_08_172339_add_stripe_customer_id_to_clients_table.php
```

## Routes

| Method | URI | Name | Description |
|--------|-----|------|-------------|
| POST | `/stripe/webhook` | `stripe.webhook` | Receives Stripe events. No auth (called directly by Stripe's servers) — excluded from CSRF verification in `bootstrap/app.php` (`validateCsrfTokens(except: ['stripe/webhook'])`) |

## Configuration

Two keys in `config/services.php` → `services.stripe`, read from env:

| Env var | Description |
|---------|--------------|
| `STRIPE_SECRET` | Your Stripe secret key (`sk_test_...` or `sk_live_...`). Used for API calls (retrieving Products/Customers) |
| `STRIPE_WEBHOOK_SECRET` | The endpoint's signing secret (`whsec_...`), used to verify incoming webhook signatures. **Different per environment** — the Stripe CLI (`stripe listen`) prints its own local one; a production endpoint registered in the Stripe Dashboard has a separate one |

### Project routing via Stripe Product metadata

There is **no** local table mapping projects to Stripe products/prices. Instead, each Stripe **Product** involved must carry a metadata key:

```
indiedesk_project_id = <the project's numeric id in IndieDesk>
```

Set once per Product, directly in the Stripe Dashboard (Product detail page → Metadata section). If a SaaS has multiple pricing tiers modeled as **separate Products** (common with Cashier-based billing — one Product per tier × billing interval, rather than one Product with several Prices), every one of those Products needs the same `indiedesk_project_id` value. Prices themselves never need any metadata.

This design was chosen over a local `projects.stripe_product_id` column specifically because a project can be linked to an arbitrary number of Stripe Products (one per tier), and a single-value column can't represent that without a separate list to maintain in sync.

## StripeWebhookController

Single-action controller (`__invoke`). Responsibilities:

1. Verify the webhook signature via `\Stripe\Webhook::constructEvent()` using `services.stripe.webhook_secret`. Returns HTTP 400 on `SignatureVerificationException` / `UnexpectedValueException` (and calls `report()` so it still surfaces in logs/error tracking)
2. Delegate the verified `\Stripe\Event` to `StripeWebhookHandler::handle()`
3. Return HTTP 200

Any exception thrown inside the handler is **not** caught here — it bubbles up to Laravel's default exception handler, producing a 500. This is intentional: Stripe retries failed webhook deliveries automatically, which is the correct behavior for transient failures (e.g. a network blip calling the Stripe API to fetch a Product). Only genuinely-invalid signatures get an explicit non-retriable 400.

## StripeWebhookHandler

`app/Services/Stripe/StripeWebhookHandler.php`. All the business logic lives here, independent of the HTTP layer.

### `handle(Event $event): void`

- Ignores every event type except `invoice.paid`
- **Idempotency**: checks `Payment::where('reference', $invoice->id)->exists()` before doing anything else. Stripe redelivers webhooks (retries, manual resends via `stripe events resend`), so this is required, not optional
- Resolves the project (see below); if none matches, logs a warning and returns — no payment is created, nothing crashes
- Resolves (or creates) the client, links it to the project via `$project->clients()->syncWithoutDetaching([$client->id])`, and creates the `Payment`

### `resolveProject(Invoice $invoice): ?Project`

```php
$line = $invoice->lines->data[0] ?? null;

$productId = $line?->pricing?->price_details?->product
    ?? $line?->price?->product
    ?? null;
```

Reads the product id off the invoice's first line item, then calls `$this->stripe->products->retrieve($productId)` to fetch its metadata and pull `indiedesk_project_id`.

Both invoice line item shapes are supported: the classic `line.price.product` and the newer `line.pricing.price_details.product` used by accounts on Stripe's "flexible" billing mode. Which one is populated depends on the Stripe account's billing mode.

Only the **first** line item's product is used. This assumes one subscription item per invoice, which matches this integration's target use case (a single-tier SaaS subscription per invoice) — invoices with multiple distinct line items belonging to different projects are not supported.

### `resolveClient(Invoice $invoice): Client`

Match order, most to least specific:

1. **`stripe_customer_id`** — exact match. Set on every client the first time they're resolved, so all subsequent payments from the same Stripe customer resolve instantly regardless of any name/email changes on Stripe's side afterward.
2. **Email**, exact match, only when exactly one client has that email — reliable at this point because paying implies the SaaS tenant/account already exists, so the email Stripe reports is real. This is *not* used for `Client` creation in general (see Clients module docs) since prospects are frequently entered with placeholder emails before their real one is known.
3. **Name**, exact match, only when exactly one client has that name — fallback for a client already in IndieDesk (e.g. added as a lead/prospect from manual outreach) whose stored email is still a placeholder, but whose name was entered correctly.
4. **Create** a new `Client` if nothing matched.

Steps 2 and 3 share one private helper, `findSingleMatch(string $column, string $value, string $customerId)`: runs `Client::where($column, $value)->get()`, and only acts when the count is exactly 1. **Ambiguous matches (2+) are treated as no match** — the integration never guesses when multiple clients share a name (or, in principle, an email, though the `clients.email` column is unique so that case can't occur). A new client is created instead; better a duplicate you merge manually than a payment silently attributed to the wrong person.

Any successful match or creation sets `status = 'active'` — regardless of whatever status the client had before (`lead`, `prospect`, ...). A real payment is the strongest possible signal that a lead has converted.

### `createClient(string $customerId, string $name, ?string $email): Client`

- If Stripe reports no email (rare, but the field is nullable on Stripe's side), a placeholder is generated: `stripe-{$customerId}@indiedesk.invalid` — using the `.invalid` TLD reserved by RFC 2606 for exactly this purpose, rather than inventing a real-looking fake domain.
- `clients.email` is `NOT NULL` and `UNIQUE` at the database level. If `Client::create()` throws a `QueryException` because the email happens to already belong to a different client, that's treated as a signal it's the same person: the existing client is looked up by that email and gets the Stripe id attached instead of the create failing outright.

## Client model additions

| Member | Description |
|--------|--------------|
| `stripe_customer_id` (column, nullable, unique) | Added via the migration above, in `$fillable` |
| `getStripeDashboardUrl(): ?string` | Returns the Stripe Dashboard URL for this client's customer record, or `null` if not linked. Points to `/test/customers/{id}` or `/customers/{id}` based on whether the currently configured `services.stripe.secret` starts with `sk_test_` |
| `totalProjectsCount(): int` | `$this->projects->count() + $this->saasProjects->count()` — used wherever a client's project count needs to include SaaS-pivot links, not just directly-owned projects |

## Local Development (Stripe CLI)

For local testing, forward Stripe events to the local app with the Stripe CLI:

```bash
stripe listen --forward-to your-app.test/stripe/webhook
```

This prints a `whsec_...` value to set as `STRIPE_WEBHOOK_SECRET` for local use — separate from the one a production Dashboard endpoint issues.
