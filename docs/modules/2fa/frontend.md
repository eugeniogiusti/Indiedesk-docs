# Frontend

The 2FA module is distributed between the profile page (setup/management) and the login challenge page.

## File Structure

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

## Frontend Pattern

### UI Entry Points

- `profile/edit.blade.php`: `#two-factor` section inside the profile page
- `auth/two-factor-challenge.blade.php`: challenge during login
- `profile/trusted-devices.blade.php`: trusted device management

### Profile Orchestrator

`profile/partials/two-factor-authentication-form.blade.php` decides which state to display:

- **2FA active** -> includes `_enabled-status`
- **setup in progress** (`session('2fa_secret')`) -> includes `_setup-qr`
- **2FA disabled** -> includes `_disabled-status`

It also handles:
- flash status (`two-factor-enabled`, `two-factor-disabled`, etc.)
- one-shot display of recovery codes (`session('recovery_codes')`)

## Main Views

### `auth/two-factor-challenge.blade.php`

- challenge form targeting `2fa.verify`
- local Alpine toggle (`x-data`) between OTP input and recovery code
- `remember_device` checkbox to save device as trusted

### `_setup-qr.blade.php`

- generates inline QR with `Google2FAQRCode`
- shows manual secret fallback
- OTP confirmation form targeting `two-factor.confirm`
- cancel setup button targeting `two-factor.cancel`

### `_enabled-status.blade.php`

- shows 2FA activation date
- deactivation form with password targeting `two-factor.disable`
- trusted devices management link

### `_disabled-status.blade.php`

- CTA to enable 2FA targeting `two-factor.enable`

### `profile/trusted-devices.blade.php`

- paginated list of trusted devices
- current device badge
- revoke single / revoke all actions
- `data-confirm` support on revoke all

## UX Interactions

- login challenge supports recovery code fallback without changing page
- profile setup shows QR and manual code in the same step
- recovery codes are shown only once after enabling
- trusted devices show useful metadata (device name, IP, date added)

## Internationalization

2FA strings use two namespaces:
- `twofactor.*`
- `two_factor.*`

Both are present in the project's language files.

## Dark Mode

The module views are compatible with Tailwind `dark:*` classes.
