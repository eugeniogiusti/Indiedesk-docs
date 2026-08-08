---
title: Stripe Integration Frontend - IndieDesk
sidebar_label: Frontend
description: The Stripe integration is fully automated server-side. The only UI surface is a small "Connected to Stripe" indicator on the client show page.
keywords: [Stripe frontend, IndieDesk Stripe UI, client Stripe badge]
---

# Frontend

The Stripe integration has (deliberately) almost no frontend. Payments are recorded automatically by the webhook handler and simply appear in the existing Payments tables/lists like any manually-entered payment — no new UI was needed for that, since `<x-payments.method-badge>` already had full styling for the `stripe` method (purple, 💳, `payments.method_stripe` label) before this integration existed.

The only addition is a small connection indicator on the client show page.

## Client show header — Stripe badge

`resources/views/clients/show/_header.blade.php`

```blade
@if($client->stripe_customer_id)
    <a href="{{ $client->getStripeDashboardUrl() }}" target="_blank" rel="noopener">
        🔗 {{ __('clients.connected_to_stripe') }}
    </a>
@endif
```

Shown in the header's meta row (alongside status and project count) only when the client has a `stripe_customer_id`. Links directly to that customer's record in the Stripe Dashboard, in a new tab. Points to test or live mode automatically based on which kind of secret key (`sk_test_...` vs `sk_live_...`) is currently configured — see `Client::getStripeDashboardUrl()` in the backend docs.

The header's project count (`$client->totalProjectsCount()`) includes both directly-owned and SaaS-pivot-linked projects, so it stays accurate for clients whose only link to a project is through Stripe/SaaS.

## Internationalization

New key in `lang/*/clients.php`:

| Key | Description |
|-----|-------------|
| `connected_to_stripe` | Label next to the 🔗 badge |

Translated in all 13 supported languages.
