# Frontend

Il modulo Company usa una pagina settings con form unico e tab interne Alpine per sezionare i campi.

## Struttura File

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

## Pattern Frontend

### Orchestrator View

`resources/views/settings/business.blade.php`:
- include header
- contiene il form principale `PUT settings.business.update`
- include `_tabs-container` con tutte le sezioni
- contiene form hidden separato per `DELETE settings.business.delete-logo`

### Tabs Alpine inline

`_tabs-container.blade.php` gestisce stato tab con:
- `x-data="{ activeTab: ... }"`
- hidden input `_active_tab` valorizzato da `activeTab`
- `x-show` + `x-cloak` per contenuto sezioni

`_tabs-navigation.blade.php`:
- switch tab via `@click="activeTab = '...'"`
- aggiorna anche `window.location.hash` per UX

Tab disponibili:
- `personal`
- `legal`
- `tax`
- `contacts`
- `business`

## Sezioni form

Le partial di contenuto usano componenti Blade form (`x-form-input`, `x-form-textarea`) e separano responsabilita:

- `_personal-info`: nome/cognome owner
- `_legal-address`: indirizzo legale completo
- `_tax-info`: tax/vat + valuta default (select da `BusinessSettings::CURRENCIES`)
- `_contacts`: email, PEC, telefono
- `_business-info`: nome/descrizione business, sito, IBAN, logo

`_actions.blade.php` contiene il submit del form.

## Gestione logo

In `_business-info.blade.php`:
- mostra preview logo se `logo_path` presente (`$settings->logo_url`)
- supporta delete logo tramite submit del form hidden `delete-logo-form`
- input file con validazioni lato client (`accept`) coerenti col backend

## Navigazione

Il link al modulo e in sidebar settings:
- `resources/views/layouts/sidebar/_nav-settings.blade.php`
- route `settings.business.edit`

## Internazionalizzazione

Le stringhe UI usano principalmente:
- `lang/*/business_settings.php`

## Dark Mode

Tutte le partial sono compatibili con classi Tailwind `dark:*`.
