# Backend

The 2FA module handles two-factor authentication with TOTP, recovery codes, and trusted devices.

## File Structure

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

### Challenge login (`auth` only)

| Method | URI | Route Name | Description |
|--------|-----|------------|-------------|
| GET | `/two-factor/challenge` | `2fa.show` | 2FA challenge page |
| POST | `/two-factor/challenge` | `2fa.verify` | Verify OTP/recovery and grant access |

### Profile setup (protected group `auth`, `verified`, `2fa`)

| Method | URI | Route Name | Description |
|--------|-----|------------|-------------|
| POST | `/two-factor/enable` | `two-factor.enable` | Start setup (secret stored in session) |
| POST | `/two-factor/confirm` | `two-factor.confirm` | Confirm setup with OTP |
| POST | `/two-factor/cancel` | `two-factor.cancel` | Cancel setup in progress |
| DELETE | `/two-factor/disable` | `two-factor.disable` | Disable 2FA (password required) |

### Trusted devices

| Method | URI | Route Name | Description |
|--------|-----|------------|-------------|
| GET | `/profile/trusted-devices` | `profile.trusted-devices.index` | List trusted devices |
| DELETE | `/profile/trusted-devices/{deviceId}` | `profile.trusted-devices.revoke` | Revoke single device |
| DELETE | `/profile/trusted-devices` | `profile.trusted-devices.revoke-all` | Revoke all devices |

## Middleware

`EnsureTwoFactorAuthenticated` is registered as alias `2fa` in `bootstrap/app.php`.

Logic:
- passes if user is not authenticated (delegated to other middleware)
- passes if 2FA is not enabled (`two_factor_confirmed_at` is null)
- passes if current device is trusted
- passes if session contains `2fa_verified_{userId}`
- avoids loops by allowing `2fa.*` routes
- otherwise redirects to `2fa.show`

## Controller

### TwoFactorChallengeController

- **show()**: shows challenge page only if 2FA is confirmed
- **verify()**:
  - validates code (`VerifyTwoFactorRequest`)
  - verifies OTP or recovery via `TwoFactorService`
  - if recovery code used, it is consumed
  - sets session `2fa_verified_{userId}=true`
  - optional: saves device as trusted (`remember_device`)

### TwoFactorSetupController

- **enable()**: generates secret and saves it in session `2fa_secret`
- **confirm()**:
  - reads `2fa_secret` from session
  - verifies OTP code
  - enables 2FA on user + generates recovery codes
  - saves recovery codes in session for one-shot display
  - sets session `2fa_verified_{userId}`
- **cancel()**: removes `2fa_secret` from session
- **disable()**: requires password (`DisableTwoFactorRequest`), disables 2FA and clears session

### TrustedDeviceController

- **index()**: loads devices with `TrustedDeviceQuery`, computes current device hash
- **revoke()**: deletes a user's device
- **revokeAll()**: deletes all devices and resets session `2fa_verified_{userId}`

## Services

### TwoFactorService

Responsibilities:
- TOTP secret generation (`PragmaRX/Google2FA`)
- TOTP code verification
- recovery codes generation
- OTP or recovery code verification
- recovery code consumption
- enable/disable 2FA on the `User` model

### TrustedDeviceService

Responsibilities:
- device hash generation (UA + IP)
- trusted device creation with metadata (browser/OS name, IP)
- deduplication: does not create duplicates if hash already exists

## Model

### User

2FA-related fields:
- `two_factor_secret`
- `two_factor_recovery_codes` (cast `array`)
- `two_factor_confirmed_at` (cast `datetime`)

Relationship:
- `trustedDevices()` hasMany `TrustedDevice`

Helper:
- `hasValidTrustedDevice($hash)`

### TrustedDevice

Main fields:
- `user_id`, `device_hash`, `device_name`, `ip_address`, `expires_at`

Helper:
- `isValid()`
- `generateDeviceHash($request)`

## Form Requests

- `VerifyTwoFactorRequest`: validates challenge (`one_time_password`, `remember_device`)
- `ConfirmTwoFactorRequest`: validates OTP setup (6 digits)
- `DisableTwoFactorRequest`: requires `current_password`

## Session state used by the module

- `2fa_secret` - setup in progress
- `2fa_verified_{userId}` - challenge passed in the current session
- `recovery_codes` - codes to display immediately after enabling

## Technical notes

- The challenge flow uses `2fa.*` routes; profile setup uses `two-factor.*` routes.
- In translations, keys coexist under the `twofactor.*` and `two_factor.*` namespaces.
