# Frontend

Il modulo 2FA e distribuito tra pagina profilo (setup/gestione) e pagina challenge login.

## Struttura File

```
resources/views/
├── auth/
│   └── two-factor-challenge.blade.php
└── profile/
    ├── edit.blade.php
    ├── trusted-devices.blade.php
    └── partials/
        ├── two-factor-authentication-form.blade.php
        └── two-factor/
            ├── _disabled-status.blade.php
            ├── _setup-qr.blade.php
            ├── _enabled-status.blade.php
            └── _recovery-codes.blade.php
```

## Pattern Frontend

### Entry points UI

- `profile/edit.blade.php`: sezione `#two-factor` dentro pagina profilo
- `auth/two-factor-challenge.blade.php`: challenge durante login
- `profile/trusted-devices.blade.php`: gestione device fidati

### Orchestrator profilo

`profile/partials/two-factor-authentication-form.blade.php` decide quale stato visualizzare:

- **2FA attivo** -> include `_enabled-status`
- **setup in corso** (`session('2fa_secret')`) -> include `_setup-qr`
- **2FA disattivo** -> include `_disabled-status`

Gestisce anche:
- flash status (`two-factor-enabled`, `two-factor-disabled`, ecc.)
- visualizzazione one-shot recovery codes (`session('recovery_codes')`)

## Viste principali

### `auth/two-factor-challenge.blade.php`

- form challenge verso `2fa.verify`
- toggle Alpine locale (`x-data`) tra input OTP e recovery code
- checkbox `remember_device` per salvare device trusted

### `_setup-qr.blade.php`

- genera QR inline con `Google2FAQRCode`
- mostra secret manuale fallback
- form conferma OTP verso `two-factor.confirm`
- pulsante annulla setup verso `two-factor.cancel`

### `_enabled-status.blade.php`

- mostra data attivazione 2FA
- form disattivazione con password verso `two-factor.disable`
- link gestione trusted devices

### `_disabled-status.blade.php`

- CTA abilita 2FA verso `two-factor.enable`

### `profile/trusted-devices.blade.php`

- lista paginata device trusted
- badge device corrente
- azioni revoke singolo / revoke all
- supporto `data-confirm` su revoke all

## Interazioni UX

- challenge login supporta fallback recovery code senza cambiare pagina
- setup profilo mostra QR e codice manuale nello stesso step
- recovery codes sono mostrati una volta sola dopo enable
- trusted devices mostrano metadati utili (nome device, IP, data aggiunta)

## Internazionalizzazione

Le stringhe 2FA usano due namespace:
- `twofactor.*`
- `two_factor.*`

Entrambi sono presenti nei file lingua del progetto.

## Dark Mode

Le view del modulo sono compatibili con classi Tailwind `dark:*`.
