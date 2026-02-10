# Backend

The Meetings module manages project operational meetings with a global index (filters + statistics) and CRUD within the project context.

## File Structure

```
app/
├── Http/
│   ├── Controllers/Meetings/
│   │   └── MeetingController.php
│   └── Requests/Meetings/
│       ├── StoreMeetingRequest.php
│       └── UpdateMeetingRequest.php
├── Models/
│   └── Meeting.php
└── Queries/Meetings/
    ├── MeetingIndexQuery.php
    └── MeetingStatsQuery.php
```

## Routes

| Method | URI | Action | Description |
|--------|-----|--------|-------------|
| GET | `/meetings` | index | Global paginated meeting list with filters |
| POST | `/projects/{project}/meetings` | store | Create meeting in the project |
| PUT | `/projects/{project}/meetings/{meeting}` | update | Update project meeting |
| DELETE | `/projects/{project}/meetings/{meeting}` | destroy | Delete meeting |
| POST | `/projects/{project}/meetings/{meeting}/complete` | markCompleted | Mark meeting as completed |
| POST | `/projects/{project}/meetings/{meeting}/cancel` | markCancelled | Mark meeting as cancelled |

## Controller

The `MeetingController` uses the **Query Classes** pattern to separate query/filter logic from the controller.

### Methods

- **index()** - Uses `MeetingIndexQuery` for paginated list and `MeetingStatsQuery` for statistics cards
- **store()** - Validates with `StoreMeetingRequest`, creates meeting in the project and redirects to `projects.show?tab=meetings`
- **update()** - Validates with `UpdateMeetingRequest`, updates meeting and redirects to the meetings tab of the project show
- **destroy()** - Deletes meeting and returns to the meetings tab of the project show
- **markCompleted()** - Updates status to `completed`
- **markCancelled()** - Updates status to `cancelled`

## Model

The `Meeting` model is located in `app/Models/Meeting.php`.

### Features

- **project relationship** - each meeting belongs to a project
- **Domain constants** - `STATUSES` used in validation and UI
- **Scopes** - `status()`, `scheduled()`, `upcoming()`, `today()`, `thisWeek()`, `past()`, `forProject()`
- **Status helpers** - `isUpcoming()`, `isPast()`, `isCompleted()`, `isCancelled()`
- **CalendarEventable** - calendar event support with start/end and Google Calendar link
- **toFormPayload()** - safe edit payload (`id` + editable fields)

### Meeting Statuses

| Status | Description |
|--------|-------------|
| `scheduled` | Scheduled |
| `completed` | Completed |
| `cancelled` | Cancelled |

## Form Requests

Validation handled by:

- **StoreMeetingRequest** - meeting creation
- **UpdateMeetingRequest** - meeting update

### Required Fields

- `title` - meeting title
- `scheduled_at` - meeting date/time

### Optional Fields

- `description` - description
- `duration_minutes` - duration (15-480)
- `location` - venue
- `meeting_url` - online meeting link
- `status` - meeting status
- `notes` - notes

Note difference: in `StoreMeetingRequest` `scheduled_at` requires `after:now`, while in `UpdateMeetingRequest` it is only `date`.

## Query Classes

The module uses the **Query Classes** pattern to keep query logic out of the controller.

### MeetingIndexQuery

Manages the global meeting list with:
- pagination (15)
- eager loading `project.client`
- filters `status`, `project_id`, `date_from`, `date_to`
- search on title, description, project name
- sorting by `scheduled_at desc`

### MeetingStatsQuery

Calculates statistics for index cards:
- `upcoming`
- `today`
- `this_week`
- `completed_last_week`
