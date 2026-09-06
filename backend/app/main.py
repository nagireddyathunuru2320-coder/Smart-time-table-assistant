from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import engine
from app.routers import academic, analytics, assistant, auth, calendar, conflicts, notifications, schedule, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    limiter.reset()
    auth.limiter.reset()
    yield

app = FastAPI(
    title="Smart Academic Time Manager API",
    description="AI-powered academic scheduling platform",
    version="1.0.0",
    lifespan=lifespan,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

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