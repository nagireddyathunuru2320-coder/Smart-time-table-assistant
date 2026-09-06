# Smart Timetable Assistant AI Agent Requirements

Living source of truth for the Track B Advanced submission. Update this whenever scope or implementation status changes.

## Product Goal
Build an AI-powered academic calendar and time-management platform for students that manages schedules, assignments, exams, study planning, conflict resolution, notifications, analytics, natural-language scheduling, and multi-calendar sync.

## Core Track B Requirements
- Authentication: registration, login, logout, protected routes, password hashing, token/session handling, profile, timezone, preferences.
- Calendar management: month/week/day UI, CRUD events, recurring RRULE events, exceptions, event details, timezone-aware scheduling.
- Multi-calendar synchronization: Google Calendar, Microsoft Outlook/Graph, provider abstraction, OAuth 2.0, token refresh, revocation, sync status, error/rate-limit handling, conflict handling, minimal scopes.
- Academic management: subjects/courses, lectures, labs, tutorials, assignments, deadlines, exams, workload, priority, difficulty, estimated effort.
- Task management: CRUD tasks, priorities, deadlines, estimated duration, difficulty, completion status, subject association.
- Conflict detection: overlapping events, insufficient study time, deadline collisions, overloaded days, impossible schedules, cross-provider overlaps.
- Advanced conflict resolution: multiple explainable recommendations such as move event/session, split study session, move lower-priority task, adjust duration, or use alternate slot. Include change, reason, impact, and confidence/score.
- Intelligent study allocation: deadline urgency, priority, difficulty, estimated duration, available time, existing events, preferences, history, workload balance, breaks, and buffer time.
- Smart time blocking: generated study blocks that respect unavailable periods, preferred hours, max session duration, break duration, deadlines, and priorities.
- Predictive scheduling: productive hours, missed sessions, preferred days, completion time, procrastination, subject patterns; first version must be explainable.
- Natural-language assistant: intent extraction to structured command to validation to scheduling service to confirmation where needed to mutation. LLMs must not directly mutate the database.
- Notifications: assignment, exam, event, study, conflict, and rescheduling reminders. Architecture supports email, push/Firebase, optional SMS.
- Analytics: study hours, completed/missed tasks, productivity trends, subject study time, planned vs actual, adherence, workload distribution, productive periods, weekly/monthly insights.
- Responsive/PWA/offline: desktop, tablet, mobile; PWA where practical; cached critical events, queued actions where practical, sync recovery.

## Technical Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, React Compiler, FullCalendar.js.
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic/pydantic-settings.
- AI: LangChain where useful, provider-agnostic LLM abstraction, mock/local mode when keys are absent.
- Integrations: Google Calendar, Microsoft Outlook/Graph, one strategic productivity integration such as Todoist or Google Tasks, plus notification adapters.

## Database Requirements
Use PostgreSQL with normalized SQLAlchemy models, Alembic migrations, foreign keys, indexes for frequent queries, UTC timezone-aware timestamps, user timezone stored separately, and secure OAuth token storage strategy. Minimum tables: users, user_preferences, calendar_accounts, calendar_events, subjects, tasks, exams, study_sessions, conflicts, scheduling_recommendations, notifications, productivity_records, sync_logs, assistant_conversations, assistant_messages.

## Security Requirements
No secrets in source or frontend responses. Use password hashing, environment secrets, OAuth 2.0, minimal scopes, token refresh, token encryption/secure storage strategy, input validation, authorization checks, CORS configuration, safe errors, and audit/sync logs.

## Testing Requirements
Backend pytest coverage for auth, task/event CRUD, conflict detection, free-slot detection, study allocation, deadline prioritization, rescheduling, timezone conversion, and API behavior. Frontend build/lint plus component or critical interaction tests where practical.

## Documentation Requirements
Maintain README.md, PROJECT_REQUIREMENTS.md, PROJECT_STATUS.md, ARCHITECTURE.md, API_DOCUMENTATION.md, SCHEDULING_ALGORITHM.md, SECURITY.md, USER_GUIDE.md, PERFORMANCE.md, DEMO_GUIDE.md.

## Deployment Requirements
Frontend must be Vercel-compatible. Backend must be Railway/Render-compatible. Database must support hosted PostgreSQL. Provide `.env.example` placeholders only and avoid vendor lock-in where unnecessary.

## Bonus Features
PWA polish, offline queued mutations, advanced predictive insights, richer productivity integrations, demo data, and performance benchmarks.

## Completion Checklist
- [x] Authentication
- [x] User profile and preferences
- [x] Initial PostgreSQL/Alembic foundation
- [x] Full Track B database models and migration verified
- [ ] Repositories/services
- [x] Seed/demo data
- [x] Task management
- [x] Subject management
- [x] Exam management
- [ ] Calendar event management
- [ ] FullCalendar UI
- [ ] Google Calendar integration
- [ ] Microsoft Outlook integration
- [ ] Third productivity integration
- [ ] Notifications
- [ ] Conflict detection
- [ ] Conflict resolution
- [ ] Smart study allocation
- [ ] Time blocking
- [ ] Predictive scheduling
- [ ] Natural-language assistant
- [ ] Analytics
- [ ] Security hardening
- [ ] Tests
- [x] Documentation set
- [ ] Performance benchmarks
- [ ] Responsive UI
- [ ] PWA/offline resilience
- [ ] Deployment
- [ ] Demo preparation

## Implementation Status
- Existing: FastAPI health endpoint, SQLAlchemy engine/session, Alembic environment, normalized Track B database model migration, auth/profile/preferences APIs, seed/demo data, stock Next.js app.
- Current phase: Phase 3 backend academic CRUD complete, moving next to calendar event management and frontend app shell.
- Known gaps: no frontend app UI yet, no calendar UI yet, no calendar event API/UI yet, external integrations need mock-first adapter architecture.
- [x] Calendar event CRUD backend (/calendar-events: POST, GET list, GET by id, PATCH, DELETE) — user-scoped, calendar_account_id ownership validated, tz-aware timestamps enforced.
- [ ] Recurrence rule (rrule) interpretation for calendar events.
- [ ] Calendar event conflict detection (conflicts table not yet wired to calendar router).
- [ ] Multi-calendar sync write-back (source is currently always "local").