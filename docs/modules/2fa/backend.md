# Backend

Il modulo 2FA gestisce autenticazione a due fattori con TOTP, recovery codes e trusted devices.

## Struttura File

```
app/
├── Http/
│   ├── Controllers/TwoFactor/
│   │   ├── TwoFactorChallengeController.php
│   │   ├── TwoFactorSetupController.php
│   │   └── TrustedDeviceController.php
│   ├── Middleware/TwoFactor/
│   │   └── EnsureTwoFactorAuthenticated.php
│   └── Requests/TwoFactor/
│       ├── VerifyTwoFactorRequest.php
│       ├── ConfirmTwoFactorRequest.php
│       └── DisableTwoFactorRequest.php
├── Models/
│   ├── TrustedDevice.php
│   └── User.php
├── Queries/TwoFactor/
│   └── TrustedDeviceQuery.php
└── Services/TwoFactor/
    ├── TwoFactorService.php
    └── TrustedDeviceService.php

bootstrap/
└── app.php   # alias middleware '2fa'
```

## Routes

### Challenge login (solo `auth`)

| Metodo | URI | Nome route | Descrizione |
|--------|-----|------------|-------------|
| GET | `/two-factor/challenge` | `2fa.show` | Pagina challenge 2FA |
| POST | `/two-factor/challenge` | `2fa.verify` | Verifica OTP/recovery e accesso |

### Setup da profilo (gruppo protetto `auth`, `verified`, `2fa`)

| Metodo | URI | Nome route | Descrizione |
|--------|-----|------------|-------------|
| POST | `/two-factor/enable` | `two-factor.enable` | Avvia setup (secret in sessione) |
| POST | `/two-factor/confirm` | `two-factor.confirm` | Conferma setup con OTP |
| POST | `/two-factor/cancel` | `two-factor.cancel` | Annulla setup in corso |
| DELETE | `/two-factor/disable` | `two-factor.disable` | Disattiva 2FA (password richiesta) |

### Trusted devices

| Metodo | URI | Nome route | Descrizione |
|--------|-----|------------|-------------|
| GET | `/profile/trusted-devices` | `profile.trusted-devices.index` | Lista device fidati |
| DELETE | `/profile/trusted-devices/{deviceId}` | `profile.trusted-devices.revoke` | Revoca singolo device |
| DELETE | `/profile/trusted-devices` | `profile.trusted-devices.revoke-all` | Revoca tutti i device |

## Middleware

`EnsureTwoFactorAuthenticated` e registrato come alias `2fa` in `bootstrap/app.php`.

Logica:
- passa se utente non autenticato (delegato ad altri middleware)
- passa se 2FA non abilitato (`two_factor_confirmed_at` nullo)
- passa se device corrente e trusted
- passa se sessione contiene `2fa_verified_{userId}`
- evita loop consentendo route `2fa.*`
- altrimenti redirect a `2fa.show`

## Controller

### TwoFactorChallengeController

- **show()**: mostra pagina challenge solo se 2FA confermato
- **verify()**:
  - valida codice (`VerifyTwoFactorRequest`)
  - verifica OTP o recovery via `TwoFactorService`
  - se recovery code usato, lo consuma
  - setta sessione `2fa_verified_{userId}=true`
  - opzionale: salva device come trusted (`remember_device`)

### TwoFactorSetupController

- **enable()**: genera secret e salva in sessione `2fa_secret`
- **confirm()**:
  - legge `2fa_secret` dalla sessione
  - verifica codice OTP
  - abilita 2FA su utente + genera recovery codes
  - salva recovery codes in sessione per visualizzazione one-shot
  - setta sessione `2fa_verified_{userId}`
- **cancel()**: rimuove `2fa_secret` dalla sessione
- **disable()**: richiede password (`DisableTwoFactorRequest`), disabilita 2FA e pulisce sessione

### TrustedDeviceController

- **index()**: carica device con `TrustedDeviceQuery`, calcola hash device corrente
- **revoke()**: elimina un device dell'utente
- **revokeAll()**: elimina tutti i device e resetta sessione `2fa_verified_{userId}`

## Services

### TwoFactorService

Responsabilita:
- generazione secret TOTP (`PragmaRX/Google2FA`)
- verifica codice TOTP
- generazione recovery codes
- verifica codice OTP o recovery
- consumo recovery code
- enable/disable 2FA sul model `User`

### TrustedDeviceService

Responsabilita:
- generazione hash device (UA + IP)
- creazione device trusted con metadati (nome browser/OS, IP)
- deduplica: non crea duplicati se hash gia presente

## Model

### User

Campi 2FA rilevanti:
- `two_factor_secret`
- `two_factor_recovery_codes` (cast `array`)
- `two_factor_confirmed_at` (cast `datetime`)

Relazione:
- `trustedDevices()` hasMany `TrustedDevice`

Helper:
- `hasValidTrustedDevice($hash)`

### TrustedDevice

Campi principali:
- `user_id`, `device_hash`, `device_name`, `ip_address`, `expires_at`

Helper:
- `isValid()`
- `generateDeviceHash($request)`

## Form Requests

- `VerifyTwoFactorRequest`: valida challenge (`one_time_password`, `remember_device`)
- `ConfirmTwoFactorRequest`: valida OTP setup (6 cifre)
- `DisableTwoFactorRequest`: richiede `current_password`

## Stato sessione usato dal modulo

- `2fa_secret` - setup in corso
- `2fa_verified_{userId}` - challenge superata nella sessione corrente
- `recovery_codes` - codici da mostrare subito dopo abilitazione

## Note tecniche

- Il flusso challenge usa route `2fa.*`; setup profilo usa route `two-factor.*`.
- Nelle traduzioni convivono chiavi in namespace `twofactor.*` e `two_factor.*`.
