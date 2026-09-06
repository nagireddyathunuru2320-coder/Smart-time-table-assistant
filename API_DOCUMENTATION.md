# API Documentation

## Current Endpoints
- `GET /`: returns API identity.
- `GET /health`: checks API process and PostgreSQL connectivity.
- `POST /auth/register`: creates a user with hashed password and default preferences.
- `POST /auth/login`: validates credentials and returns a bearer access token.
- `GET /auth/me`: returns the authenticated user.
- `POST /auth/logout`: stateless logout acknowledgement.
- `GET /users/me`: returns profile.
- `PATCH /users/me`: updates profile fields.
- `GET /users/me/preferences`: returns scheduling/notification preferences.
- `PATCH /users/me/preferences`: updates scheduling/notification preferences.
- `POST /subjects`, `GET /subjects`, `GET /subjects/{id}`, `PATCH /subjects/{id}`, `DELETE /subjects/{id}`.
- `POST /tasks`, `GET /tasks`, `GET /tasks/{id}`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}`.
- `POST /exams`, `GET /exams`, `GET /exams/{id}`, `PATCH /exams/{id}`, `DELETE /exams/{id}`.

## Planned API Areas
- Calendar events, study sessions.
- Integrations: Google Calendar, Microsoft Outlook, productivity provider, sync status, revoke.
- Scheduling: free slots, conflicts, recommendations, study allocation, time blocking.
- Assistant: conversations, messages, validated structured commands.
- Notifications and analytics.

All protected endpoints must scope data by authenticated user and must not expose password hashes, OAuth tokens, refresh tokens, or API keys.
## Calendar Events

Base path: `/calendar-events` (no prefix — registered flat like /subjects, /tasks, /exams)
Auth: Bearer token required, all endpoints user-scoped.

### POST /calendar-events
| Field | Type | Required | Notes |
|---|---|---|---|
| title | string | yes | 1-255 chars |
| description | string | no | |
| location | string | no | max 255 chars |
| event_type | string | no | default "academic" |
| start_at | datetime (tz-aware) | yes | |
| end_at | datetime (tz-aware) | yes | must be after start_at |
| timezone | string | no | default "UTC" |
| all_day | bool | no | default false |
| calendar_account_id | int | no | must belong to current user |
| rrule | string | no | recurrence rule (not yet interpreted — Phase 4 is CRUD only) |
| recurrence_exception | string | no | |
| parent_event_id | int | no | |
| priority | int | no | 1-5, default 3 |
| is_busy | bool | no | default true |

`source` and `external_event_id` are system-managed fields — not accepted on create, always `"local"`/`null` for manually created events. Response: `201 Created`.

### GET /calendar-events
Query params: `start`, `end` (tz-aware ISO datetimes, range filter), `event_type`. Returns array of events, ordered by `start_at` ascending, scoped to current user.

### GET /calendar-events/{event_id}
`404` if not found or not owned.

### PATCH /calendar-events/{event_id}
Partial update, same fields as create (all optional). `404` if not owned. `422` if resulting start/end range is invalid. `400` if `calendar_account_id` doesn't belong to current user.

### DELETE /calendar-events/{event_id}
`204 No Content`. `404` if not owned.

### Notes
- Recurrence fields (`rrule`, `recurrence_exception`, `parent_event_id`) are stored but not yet interpreted by any scheduling logic — that's planned for `backend/app/scheduling/`.
- Conflict detection against the `conflicts` table is not yet wired in.
- This router is a pure CRUD/mutation surface for the eventual AI pipeline: natural language → intent extraction → structured command → validation → service → confirmation/mutation.