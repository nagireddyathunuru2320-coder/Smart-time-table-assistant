from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers import academic, analytics, assistant, auth, calendar, conflicts, notifications, schedule, users

app = FastAPI(
    title="Smart Academic Time Manager API",
    description="AI-powered academic scheduling platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(academic.router)
app.include_router(calendar.router)  # Phase 4: calendar event CRUD
app.include_router(conflicts.router)  # Phase 7: conflict detection
app.include_router(schedule.router)  # Phase 9: free-time detection
app.include_router(assistant.router)  # Phase 11: AI assistant (mock provider)
app.include_router(analytics.router)  # Phase 12: analytics dashboard
app.include_router(notifications.router)  # Phase 13: in-app notifications


@app.get("/")
def root():
    return {
        "message": "Smart Academic Time Manager API"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as error:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error)
        }