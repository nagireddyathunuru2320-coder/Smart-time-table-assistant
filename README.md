# Smart Timetable Assistant AI Agent

Track B Advanced project: an AI-powered academic calendar and time-management platform for students.

## Current State
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL foundation.
- Frontend: Next.js, React, TypeScript, Tailwind CSS foundation.
- Requirements and status are tracked in `PROJECT_REQUIREMENTS.md` and `PROJECT_STATUS.md`.

## Local Development
Backend:

```powershell
cd backend
Copy-Item .env.example .env
venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Default local URLs:
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:8000
