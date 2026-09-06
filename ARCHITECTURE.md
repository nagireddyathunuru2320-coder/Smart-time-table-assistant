# Architecture

Smart Timetable Assistant is split into a Next.js frontend and FastAPI backend backed by PostgreSQL.

## Backend
- `app/main.py`: FastAPI application and health checks.
- `app/database.py`: SQLAlchemy engine, session factory, and declarative base.
- `app/models`: normalized relational database models.
- Planned: `schemas`, `routers`, `services`, `repositories`, `integrations`, `scheduling`, `ai`, `auth`, `utils`, and `tests`.

External integrations must live behind provider interfaces. Google Calendar, Microsoft Graph, and productivity integrations use OAuth adapters with mock/demo implementations when credentials are absent.

Scheduling logic must be deterministic and testable outside FastAPI. LLM providers only interpret natural language, extract structure, and explain recommendations.

## Frontend
Next.js App Router with TypeScript and Tailwind CSS. Planned app sections: dashboard, calendar, tasks, subjects, assistant, analytics, settings, and integrations. FullCalendar powers calendar views.

## Data Rules
Store timestamps in UTC with timezone-aware datetime columns. Store each user's timezone separately. Never expose password hashes, OAuth tokens, refresh tokens, or API keys.
