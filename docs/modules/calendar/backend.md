---
title: Calendar Module Backend - IndieDesk
sidebar_label: Backend
description: Google Calendar integration in Laravel. Event management, calendar link generation, FullCalendar patterns and scheduling system.
keywords: [Laravel calendar, Google Calendar integration, event management, FullCalendar, IndieDesk calendar, scheduling, calendar events]
---

# Backend

The Calendar module has **two independent layers**:

1. **Link generation** (`GoogleCalendarLinkBuilder`) — builds `calendar.google.com/calendar/render` URLs that open Google's pre-filled "Create event" form. Stateless, no API involved, no authentication required. This is the original manual "Add to Google Calendar" button.
2. **Automatic sync** (`GoogleCalendarClient` + `GoogleCalendarSync`) — talks to the Google Calendar API over REST and creates/updates/deletes real events on the user's primary calendar as records change, with no manual step. Requires a one-time OAuth connection.

Both layers share the same `CalendarEventable` contract and `CalendarEvent` DTO, so a model implements the conversion once and gets both behaviours.

## File Structure

```
app/
├── Contracts/
│   └── CalendarEventable.php
├── Models/
│   └── GoogleCalendarSettings.php      # OAuth tokens (singleton)
├── Http/Controllers/Settings/
│   └── GoogleCalendarSettingsController.php
└── Services/Calendar/
    ├── CalendarEvent.php               # shared DTO
    ├── GoogleCalendarLinkBuilder.php   # layer 1 — manual links
    ├── GoogleCalendarClient.php        # layer 2 — REST client + token refresh
    └── GoogleCalendarSync.php          # layer 2 — create/update/delete orchestration
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/calendar` | closure | Page with embedded Google Calendar iframe |
| GET | `/settings/google-calendar/connect` | google-calendar.connect | Redirect to Google's OAuth consent screen |
| GET | `/settings/google-calendar/callback` | google-calendar.callback | Stores the returned tokens |
| DELETE | `/settings/google-calendar/disconnect` | google-calendar.disconnect | Forgets the stored tokens |

The `/calendar` route is a closure in `routes/web.php` that renders `calendar.index`. The three OAuth routes sit in the `settings` prefix and, like the rest of the app, are behind `auth` + `verified` + `2fa`.

## Contract CalendarEventable

Interface that models implement to expose calendar data:

```php
interface CalendarEventable
{
    public function toCalendarEvent(): CalendarEvent;
    public function hasCalendarDate(): bool;
    public function calendarTitleBody(): string;
}
```

- `hasCalendarDate()` - returns `true` if the model has a valid calendar date
- `toCalendarEvent()` - converts the model into a `CalendarEvent` DTO
- `calendarTitleBody()` - the **stable** part of the title, without any state-dependent prefix (emoji, sequence number). Used by the sync to recognise an event that already exists on the calendar; see [Duplicate protection](#duplicate-protection) below

:::warning
All six models implementing this interface must be updated together when the contract changes. A model missing a method cannot be loaded by PHP at all, which 500s every page that references it — not just the calendar feature.
:::

## DTO CalendarEvent

Value object representing an event:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Event title |
| `description` | `string` | Multi-line description |
| `startDate` | `Carbon` | Start date/time |
| `endDate` | `?Carbon` | End date/time (optional) |
| `location` | `?string` | Venue or meeting URL |
| `isAllDay` | `bool` | All-day event (default `true`) |

## GoogleCalendarLinkBuilder

Service that builds the Google Calendar URL from a `CalendarEvent`.

### Construction

Two static entry points:
- `fromEvent(CalendarEvent $event)` - from a direct DTO
- `fromModel(CalendarEventable $model)` - from a model (calls `toCalendarEvent()` internally)

### Generated URL Parameters

| Parameter | Value |
|-----------|--------|
| `action` | `TEMPLATE` (opens creation form) |
| `text` | event title |
| `details` | event description |
| `dates` | formatted date range |
| `location` | venue (only if present) |

### Date Formats

- **All-day**: `YYYYMMDD/YYYYMMDD` (exclusive end date, adds +1 day)
- **With time**: `YYYYMMDDTHHmmss/YYYYMMDDTHHmmss` (local time)
- If `endDate` is null: single day (all-day) or default 1-hour duration (with time)

## Automatic Sync

### Authentication

OAuth2 with `laravel/socialite` (`google` driver), requesting the `calendar.events` scope with `access_type=offline` + `prompt=consent` so Google returns a **refresh token** — without it the integration would break as soon as the first access token expired.

`GoogleCalendarSettingsController` handles the three steps: `connect()` redirects to the consent screen, `callback()` stores the tokens, `disconnect()` clears them. The redirect URL is set per-call with `redirectUrl(route(...))` rather than in `config/services.php`, so the callback URL always matches the app's current domain; the `redirect` config key is still present (set to `null`) because Socialite requires it to exist.

Credentials come from `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.

### GoogleCalendarSettings

Singleton model (`google_calendar_settings` table, `current()` with static cache — same pattern as `BusinessSettings`).

| Field | Notes |
|-------|-------|
| `access_token` | `encrypted` cast, short-lived |
| `refresh_token` | `encrypted` cast, long-lived — presence of this is what `isConnected()` checks |
| `expires_at` | when the access token dies |
| `email` | Google account shown in the settings UI |

### GoogleCalendarClient

Thin REST client over the `Http` facade against `calendars/primary/events`. Deliberately **not** `google/apiclient` (heavy) or `spatie/laravel-google-calendar` (authenticates from a locally generated `token.json`, incompatible with a "Connect" button on a remote app).

| Method | Purpose |
|--------|---------|
| `createEvent(CalendarEvent)` | Returns the new Google event id, or `null` on failure |
| `updateEvent(string $id, CalendarEvent)` | `false` on failure — this is how the sync detects an event deleted on Google's side |
| `deleteEvent(string $id)` | `404`/`410` (already gone) counts as success |
| `findEventIdOnDate(Carbon, string)` | Duplicate protection, see below |
| `isConnected()` | Delegates to the settings singleton |

Access tokens are refreshed transparently: `getValidAccessToken()` returns the stored token while `expires_at` is in the future, otherwise it exchanges the refresh token for a new one and persists it (with a 60s safety margin). Failures are logged as warnings (`Google Calendar: failed to ...`) and degrade to `null`/`false` — they never throw into the request.

**All-day vs timed events**: `buildPayload()` honours the DTO's `isAllDay` flag — all-day events send a `date` range (exclusive end, +1 day), timed events send `dateTime` + `timeZone` with the real start/end (defaulting to +1h when `endDate` is null). `location` is forwarded when present. Meetings are the only timed entity.

### GoogleCalendarSync

Single generic service used by **all** entities — there is no per-model sync class. It works on any `Model & CalendarEventable` that has a nullable `google_event_id` column.

```php
$sync->sync($model);    // create or update the linked event
$sync->delete($model);  // remove the linked event and clear google_event_id
```

`sync()` logic, in order:

1. No connection or no date on the record → **silent no-op** (the app works normally with the integration switched off)
2. `google_event_id` present and the update succeeds → done
3. Otherwise look for a pre-existing event to adopt (see below), else create a new one
4. Store the resulting id with `saveQuietly()` — it must not fire model events or bump timestamps

The id is written with `forceFill()` + `saveQuietly()` on purpose: `google_event_id` is infrastructure state, not user data, so it is deliberately **not** in any model's `$fillable`.

### Duplicate protection

Records that predate this feature may already have an event created by hand through the manual link. Before creating anything, `findEventIdOnDate()` searches that specific day for an event whose title contains the record's `calendarTitleBody()`; if found, the sync adopts it (stores its id and updates it) instead of adding a second copy.

This is why the sequence number and the done/pending emoji live in `toCalendarEvent()`'s title but **not** in `calendarTitleBody()`: those parts change over time, and if they were part of the matching key every renumbering would fail to match and duplicate the event.

### Sync triggers

Sync is called from controllers, not from model events — the trigger points are explicit and include state toggles that don't change the record's date:

| Entity | Synced on |
|--------|-----------|
| Client follow-up | create, update, delete, done/not-done toggle |
| Project | create, update, delete (removes event), restore (recreates it) |
| Task | create, update, delete, done/undone toggle |
| Meeting | create, update, delete, mark completed, mark cancelled |
| Payment | create, update, delete |
| Tax | create, update, delete |

Client follow-ups are the exception to "sync only the edited record": because the event title carries the contact's chronological position, adding/deleting/re-dating one follow-up shifts the others, so `ClientFollowupController` re-syncs the whole client's set (`syncClientFollowups()`). The done/not-done toggle doesn't reorder anything and syncs just the one record.

## Models Implementing CalendarEventable

6 models implement the interface. Each exposes a `googleCalendarUrl()` method that returns the manual link, or `null` if it has no date.

### Project

- **Condition**: `due_date !== null`
- **Date**: `due_date`
- **All-day**: yes
- **Title**: `📋 {client/Internal Project}: {name} - Deadline`
- **Description**: project section (type, status, priority, dates) + client section (if present) + notes/description (if present)

### Task

- **Condition**: `due_date !== null`
- **Date**: `due_date`
- **All-day**: yes (default)
- **Title**: `📋 Task: [{project}] {title}`
- **Description**: project section + details section (status, priority) + task description (if present)

### Payment

- **Condition**: `paid_at !== null` **or** `due_date !== null`
- **Date**: `paid_at`, falling back to `due_date` (an unpaid invoice lands on its due date)
- **All-day**: yes (default)
- **Title**: `💰 Invoice: [{project}] {formatted amount}`
- **Description**: project section + details section (amount, currency, status) + notes (if present)

### Meeting

- **Condition**: `scheduled_at !== null`
- **Start date**: `scheduled_at`
- **End date**: `getEndTime()` (calculated from duration)
- **All-day**: no (only model with time)
- **Location**: `meeting_url` or `location` (fallback)
- **Title**: `🗓️ Meeting: [{project}] {title}`
- **Description**: project section + details section (date, duration, type, participants) + notes/description (if present)

### Tax

- **Condition**: `due_date !== null`
- **Date**: `due_date`
- **All-day**: yes
- **Title**: `✅ ` prefix once `paid_at` is set, then the tax deadline label (description + reference year)
- **Description**: description, amount with the configured currency symbol, reference year, due date, `Paid at` line once paid, notes (if present)

### ClientFollowup

- **Condition**: `contacted_at !== null`
- **Date**: `contacted_at`
- **All-day**: yes
- **Title**: `{✅ if completed, else 📞} #{sequence} Follow-up: {client} — {type}`
- **Description**: contact number, type, contact date, note (if present)

The state prefix and `#{sequence}` are added in `toCalendarEvent()`; `calendarTitleBody()` returns only `Follow-up: {client} — {type}` so the duplicate search keeps matching when either changes. `sequenceNumber()` is the record's chronological position among that client's follow-ups (ordered by `contacted_at`, then `id` as tiebreak) — 1 means first contact attempt.

## Description Pattern

All models build the description with the same pattern:
- Private methods `buildProjectSection()`, `buildDetailsSection()`, `buildNotesSection()`
- Each section is a multi-line string with header and fields
- Sections are joined with `implode("\n\n", $sections)`
- Optional sections (notes, description, client) are included only if they have content

## Technical Notes

- **Link generation is stateless**: `GoogleCalendarLinkBuilder` is a pure service with no external dependencies and saves nothing.
- **Sync is stateful**: it stores OAuth tokens (`google_calendar_settings`) and one `google_event_id` per synced record. That column is the only link between a record and its calendar event — clearing it makes the next sync create a fresh event.
- Sync failures never break a request: API errors are logged and swallowed, so a Google outage degrades to "the event didn't update", not a 500.
- All Google traffic is **outbound**; the only inbound hit is the OAuth callback, which arrives from the user's own browser. The integration therefore works behind an IP-restricted proxy.
- The `CalendarEventable` interface allows adding new calendar models by implementing the 3 methods (+ a `google_event_id` column if the model should sync).
- The `/calendar` page is a simple embedded Google Calendar iframe and is not connected to either layer — it just displays the resulting calendar.

## Google Cloud Setup

The integration needs an OAuth client created in the Google Cloud Console:

1. Enable the **Google Calendar API** for the project
2. Create an **OAuth client ID** of type *Web application*
3. Register `https://{your-domain}/settings/google-calendar/callback` as an authorized redirect URI
4. Put the client id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then `php artisan config:clear`

:::warning Publishing status
Leave the OAuth consent screen in **Testing** and Google expires the refresh token after 7 days, which silently breaks the sync every week. Switch the app to **In production** to avoid it. For an external app that requires an app name, support email, homepage URL and privacy policy URL to be filled in — the URLs only need to be present and well-formed at this stage, they are not crawled unless you submit the app for full verification. Publishing without verification is fine for personal use: users just see an "unverified app" interstitial on the consent screen. `Internal` is not selectable on a personal Google account — it requires a Google Workspace organization.
:::
