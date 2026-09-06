from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import CalendarEvent, User, UserPreference
from app.schemas.schedule import FreeSlotRead
from app.schemas.study_plan import NeedConsidered, StudyPlanBlock, StudyPlanResponse, UnmetNeed
from app.scheduling.free_slots import find_free_slots
from app.services.study_allocation_service import generate_study_plan

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/free-slots", response_model=list[FreeSlotRead])
def get_free_slots(
    start: datetime = Query(...),
    end: datetime = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FreeSlotRead]:
    if start.tzinfo is None or end.tzinfo is None:
        raise HTTPException(status_code=422, detail="start and end must be timezone-aware")
    if end <= start:
        raise HTTPException(status_code=422, detail="end must be after start")
    if (end - start).days > 31:
        raise HTTPException(status_code=422, detail="range cannot exceed 31 days")

    preferences = db.scalar(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    if preferences is None:
        raise HTTPException(status_code=404, detail="Preferences not found")

    events = list(
        db.scalars(
            select(CalendarEvent).where(
                CalendarEvent.user_id == current_user.id,
                CalendarEvent.end_at > start,
                CalendarEvent.start_at < end,
            )
        ).all()
    )

    slots = find_free_slots(
        range_start=start,
        range_end=end,
        busy_events=events,
        preferred_study_start=preferences.preferred_study_start,
        preferred_study_end=preferences.preferred_study_end,
        min_session_minutes=preferences.min_session_minutes,
        user_timezone=current_user.timezone,
    )

    return [
        FreeSlotRead(start=s.start, end=s.end, duration_minutes=s.duration_minutes)
        for s in slots
    ]


@router.post("/generate-study-plan", response_model=StudyPlanResponse)
def generate_study_plan_endpoint(
    days: int = Query(default=14, ge=1, le=60),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyPlanResponse:
    result = generate_study_plan(db, current_user, horizon_days=days)

    created_blocks = []
    for event in result.created:
        _, entity_type, entity_id = event.external_event_id.split(":")
        created_blocks.append(
            StudyPlanBlock(
                id=event.id,
                entity_type=entity_type,
                entity_id=int(entity_id),
                title=event.title,
                start_at=event.start_at,
                end_at=event.end_at,
            )
        )

    return StudyPlanResponse(
        horizon_days=result.horizon_days,
        created=created_blocks,
        unmet=[UnmetNeed(**u) for u in result.unmet],
        needs_considered=[NeedConsidered(**n) for n in result.needs_considered],
    )
