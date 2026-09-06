# Project Status

## Current Phase
Phase 3: Academic CRUD.

## Completed Work
- Audited repository structure.
- Confirmed existing FastAPI health endpoint, SQLAlchemy setup, Alembic setup, and initial `users` migration.
- Confirmed frontend is currently a stock Next.js/Tailwind app.
- Created living requirements document.
- Added normalized SQLAlchemy models for required Track B tables.
- Added and applied Alembic migration `c4eee4af0a62_add_academic_scheduling_tables`.
- Added backend `.env.example` and corrected backend `.gitignore`.
- Added a small generic repository base and idempotent demo seed script.
- Added backend config module and request-scoped database dependency.
- Added PBKDF2 password hashing and signed expiring bearer token utilities.
- Added auth APIs: register, login, current user, logout.
- Added user APIs: profile read/update and preferences read/update.
- Added focused API tests for registration, duplicate email rejection, login failure, current user, profile update, and preference update.
- Added backend CRUD APIs for subjects, tasks, and exams.
- Added user ownership validation for academic resources and subject associations.
- Added academic API tests for CRUD and cross-user access protection.

## Current Work
- Phase 3 backend academic CRUD is complete enough to move into calendar event management and frontend app shell.

## Next Work
- Implement calendar event CRUD with RRULE-ready fields.
- Start the actual frontend app shell for auth/dashboard navigation.
- Add typed frontend API client after backend endpoint shapes stabilize.

## Known Issues
- Root Git status shows deleted `main.py`; it was an obsolete print script and should remain removed.
- Frontend and backend appear largely untracked/ignored; backend `.gitignore` needed correction.
- Need standard JWT dependency later if we want interoperable JWTs instead of the current stdlib signed token.

## Architecture Decisions
- Free-first and mock-first integrations.
- Deterministic scheduling engine before LLM assistance.
- LLM output must become validated structured commands before any mutation.

## Tests Status
- Backend: model import and `compileall` passed; Alembic `upgrade head` passed; Alembic `check` passed.
- Backend: demo seed ran twice successfully; current seed counts are 1 user, 1 subject, 1 task, 1 exam, 1 calendar event.
- Backend: `python -m pytest app\tests` passed with 6 tests.
- Frontend: `npm run lint` passed; `npm run build` passed after removing the stock external Google font dependency. Build still warns that Next ignored `C:\Users\HP\package-lock.json` outside the repo.
- Warnings: pytest reports a Starlette TestClient deprecation and a non-blocking pytest cache warning on OneDrive.
## Phase 4: Calendar Event CRUD Backend — COMPLETE

- Added backend/app/schemas/calendar.py (CalendarEventCreate/Update/Read), tz-aware validation, start_at/end_at ordering checks.
- Added backend/app/routers/calendar.py: user-scoped CRUD for calendar_events, calendar_account_id ownership validation, start/end/event_type filtering on list.
- Registered calendar router in backend/app/main.py.
- Added backend/app/tests/test_calendar.py: create, list, get, update, delete, inverted-range rejection (create + update), naive-datetime rejection, cross-user scoping, invalid calendar_account_id rejection.
- Updated API_DOCUMENTATION.md with /calendar-events reference.
- Deferred: recurrence rule interpretation, conflict detection, multi-calendar sync write-back.

### Next step
Phase 5: Frontend app shell + typed API client, then FullCalendar UI wired to /calendar-events.
### Verification
- `python -m pytest app\tests` -> 16 passed
- `alembic check` -> no schema drift
- `npm run lint` -> clean
- `npm run build` -> clean (fixed Turbopack root warning via `turbopack.root` in next.config.ts)

### Next step
Phase 5: Frontend app shell + typed API client, then FullCalendar UI wired to /calendar-events.
Auth token strategy: httpOnly cookie issued via Next.js route handlers proxying to FastAPI (chosen over client-side storage for XSS resistance).
## Phase 5: Frontend App Shell + Calendar UI — COMPLETE

- Added httpOnly-cookie auth flow: login/register/logout pages, Next.js route handlers
  (app/api/auth/*) proxying to FastAPI, middleware.ts protecting authenticated routes.
- Added app shell: layout.tsx with server-rendered NavBar reflecting auth state.
- Added typed calendar API client (lib/calendar-api.ts) calling Next.js route handlers
  (app/api/calendar-events, app/api/calendar-events/[id]) which proxy to the FastAPI backend.
- Added FullCalendar-based calendar page (app/calendar/page.tsx,
  components/calendar/CalendarView.tsx): week/day/month views, click-drag create,
  drag-to-reschedule, click-to-delete, all persisted through the real backend.
- Fixed FullCalendar package version mismatch (@fullcalendar/react pinned to v6 to match
  @fullcalendar/core v6 used by daygrid/timegrid/interaction).
- Verification: npm run lint -> clean, npm run build -> clean, manual create/drag/delete/
  refresh test passed against live Postgres-backed data.

### Next step
Phase 6: Subjects/Tasks/Exams frontend CRUD pages (backend already exists from Phase 3).
## Phase 6: Frontend CRUD Completion — COMPLETE
- Added Exams frontend page (app/exams/page.tsx, components/exams/ExamManager.tsx) with
  countdown badges based on days-until-exam.
- Added Settings/Preferences frontend page (app/settings/page.tsx,
  components/settings/SettingsForm.tsx) covering profile and study preferences.
- Applied full visual redesign: paper/ink/navy/brass design system in globals.css,
  serif display headings, restyled NavBar with active-link states and avatar.
- All CRUD entities (Subjects, Tasks, Exams, Calendar Events, Profile, Preferences)
  now have working, tested, styled frontend pages.

## Phase 7: Conflict Detection (Backend) — COMPLETE
- Added backend/app/scheduling/conflicts.py: pure overlap-detection logic
  (sweep algorithm over busy calendar events, O(n log n)), severity scoring
  (low/medium/high based on overlap duration).
- Added backend/app/services/conflict_service.py: reconciles detected overlaps
  with the conflicts table — creates new conflict records, auto-resolves ones
  that no longer overlap, dedupes via a stable (event_a_id, event_b_id) pair key.
- Added backend/app/schemas/conflict.py and backend/app/routers/conflicts.py:
  GET /conflicts (with optional ?status= filter, triggers a fresh sync),
  PATCH /conflicts/{id} (manual status update, e.g. dismiss).
- Added migration d66f07d816a5: conflicts.secondary_entity_id column, enabling
  a conflict record to reference both overlapping entities without hacking
  IDs into text fields.
- Added backend/app/tests/test_conflicts.py: 6 tests covering no-overlap,
  overlap detection + severity, non-busy exclusion, auto-resolve on move,
  user scoping, and manual status update.
- Verification: python -m pytest app\tests -> 22 passed, alembic check -> no drift.
- Deliberately NOT hooked into calendar.py's create/update endpoints — conflict
  sync runs on GET /conflicts instead, keeping calendar CRUD simple and this
  feature independently testable. Revisit if real-time conflict flagging on
  event creation is needed later.

### Next step
## Phase 8: Conflicts Frontend Page — COMPLETE

- Added src/lib/conflicts-api.ts, src/app/api/conflicts/route.ts + [id]/route.ts,
  src/components/conflicts/ConflictList.tsx, src/app/conflicts/page.tsx.
- Severity badges (high/medium/low), status badges (open/resolved/dismissed),
  dismiss/reopen actions, "show resolved & dismissed" toggle.
- Added Conflicts to nav and protected routes.

### Bug found + fixed: duplicate conflict rows on repeated sync
- Root cause: sync_conflicts_for_user only checked for existing "open" conflicts
  when deciding whether to create a new one. Dismissing a conflict, then
  reloading the page, caused a fresh duplicate to be created every time,
  since the dismissed one no longer counted as "already tracked."
- Fix: sync now treats both "open" and "dismissed" as active/tracked states
  for a given event pair. A new conflict is only created if no active record
  exists for that pair, or if a prior record for the pair was fully "resolved"
  (the overlap genuinely went away and later recurred).
- Added regression test: test_sync_does_not_duplicate_dismissed_conflicts
  (dismisses a conflict, calls GET /conflicts 3x, asserts exactly one row).
- Verification: python -m pytest app\tests -> 23 passed. Manually confirmed
  in browser: conflicts page shows exactly one entry per overlapping pair
  after clearing stale test data and reloading.

### Next step
## Phase 9: Free-Time Detection (Backend) — COMPLETE

- Added backend/app/scheduling/free_slots.py: pure logic that computes open
  time slots in a user's schedule, given a date range, their busy calendar
  events, and their preferred study window (preferred_study_start/end,
  min_session_minutes from user_preferences).
- Correctly interprets the study window in the user's own timezone
  (user.timezone, via zoneinfo) even though calendar events are stored in
  UTC — handles the UTC/local-date-boundary conversion explicitly.
- Discards any resulting free slot shorter than the user's min_session_minutes
  preference, so results are always usable (no 3-minute "gaps").
- Added backend/app/schemas/schedule.py, backend/app/routers/schedule.py:
  GET /schedule/free-slots?start=...&end=... (both tz-aware ISO datetimes,
  max 31-day range).
- Added backend/app/tests/test_free_slots.py: 9 tests — empty calendar,
  event-in-middle splitting, sub-minimum-gap discarding, non-busy exclusion,
  multi-day ranges, fully-booked day, endpoint smoke test (verifies no
  returned slot overlaps a real busy event), tz-aware param validation,
  inverted-range rejection.
- Verification: python -m pytest app\tests -> 32 passed, alembic check ->
  no drift (no schema changes this phase).
- No frontend page yet — this is a pure capability endpoint intended to be
  called by the study-block allocator (next phase), not browsed directly
  by users. Can be exercised manually via /docs.

### Next step
## Phase 10: Smart Study Block Allocation — COMPLETE

- Added backend/app/scheduling/allocation.py: pure greedy allocation logic.
  Sorts study "needs" (tasks/exams with deadlines) by urgency (soonest
  deadline first, ties broken by priority), then fills free-time slots
  chronologically, splitting any need larger than max_session_minutes into
  multiple sessions separated by break_minutes. Reports unmet minutes for
  anything that couldn't be scheduled before its deadline.
- Added backend/app/services/study_allocation_service.py: orchestrates DB
  reads (tasks, exams, preferences, existing calendar events), calls
  free_slots + allocation, and writes results as real CalendarEvent rows
  (event_type="study_block", source="ai_generated").
- Idempotent regeneration: each run deletes only this user's future
  ai_generated study blocks before writing new ones — past blocks are kept
  as history, and repeated runs never create duplicates.
- Added POST /schedule/generate-study-plan?days=N (default 14, max 60).
  Explicit user-triggered action, not automatic — consistent with the
  project's rule that scheduling mutations require deliberate confirmation.
- Added backend/app/tests/test_allocation.py (5 tests: single-slot
  allocation, splitting across max-session with breaks, urgency ordering
  under scarcity, fully-unmet deadline-before-any-slot case, sub-minimum
  slot skipping) and test_study_plan.py (3 tests: end-to-end creation +
  idempotency, unmet-need reporting, user scoping).
- Manually verified: generated a real study plan via /docs for a task with
  a deadline, confirmed the resulting "Study: <task title>" blocks appear
  correctly on the live Calendar page.

  ## Phase 10 (continued): Bug fixes verified

- Fixed: regenerating a study plan twice created overlapping blocks/conflicts,
  because stale-block cleanup only deleted blocks starting after "now" —
  a block created moments earlier in the previous run could already be in
  the past relative to the second call's "now" and get skipped, leaving it
  to collide with a freshly scheduled block. Fixed by deleting any
  unfinished block (end_at > now) instead.
- Fixed: exams were not treated as busy time during allocation (they live
  in a separate table from calendar_events), allowing study blocks to be
  scheduled directly on top of a user's own exam. Fixed by synthesizing
  in-memory busy windows from each upcoming exam's time range during
  free-slot computation.
- Fixed: Calendar page's "Generate study plan" button reported success but
  didn't visually update the grid, because CalendarView's local state was
  only initialized once from initialEvents and never re-synced. Fixed with
  a useEffect syncing local state whenever initialEvents changes, combined
  with router.refresh() after generation.
- Verified manually: regenerating twice produces zero open conflicts;
  study blocks never overlap exam windows; "N min short before deadline"
  messages correctly reflect genuinely insufficient free time, not a bug.
- Backend tests: 43 passed (added 2 regression tests for the two backend
  fixes above).

### Next step
Phase 11: "Generate my study plan" button on the frontend (currently
backend/docs-only), likely on the Dashboard or Calendar page.
Then: Analytics (productivity_records) and/or AI/NL assistant layer.