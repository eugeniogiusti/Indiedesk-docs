# Backend

The Calendar module handles the generation of Google Calendar links for application events. It does not use the Google API: it builds `calendar.google.com/calendar/render` URLs with query parameters that open the pre-filled "Create event" form.

## File Structure

```
app/
├── Contracts/
│   └── CalendarEventable.php
└── Services/Calendar/
    ├── CalendarEvent.php
    └── GoogleCalendarLinkBuilder.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/calendar` | closure | Page with embedded Google Calendar iframe |

The route is a closure in `routes/web.php` that renders `calendar.index`.

## Contract CalendarEventable

Interface that models implement to expose calendar data:

```php
interface CalendarEventable
{
    public function toCalendarEvent(): CalendarEvent;
    public function hasCalendarDate(): bool;
}
```

- `hasCalendarDate()` - returns `true` if the model has a valid calendar date
- `toCalendarEvent()` - converts the model into a `CalendarEvent` DTO

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

## Models Implementing CalendarEventable

4 models implement the interface. Each exposes a `googleCalendarUrl()` method that returns the URL or `null` if it has no date.

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

- **Condition**: `paid_at !== null`
- **Date**: `paid_at`
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

## Description Pattern

All models build the description with the same pattern:
- Private methods `buildProjectSection()`, `buildDetailsSection()`, `buildNotesSection()`
- Each section is a multi-line string with header and fields
- Sections are joined with `implode("\n\n", $sections)`
- Optional sections (notes, description, client) are included only if they have content

## Technical Notes

- The system is **stateless**: it does not save events, it only generates links to create events in the user's Google Calendar.
- `GoogleCalendarLinkBuilder` is a pure service with no external dependencies.
- The `CalendarEventable` interface allows adding new calendar models by implementing the 2 methods.
- The `/calendar` page is a simple embedded Google Calendar iframe and is not connected to the link builder system.
