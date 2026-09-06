"""Calendar event CRUD endpoints (Phase 4).

This router is a pure CRUD/mutation surface. It does not accept free-text
input and is not the entry point for natural-language scheduling. Any future
LLM-driven scheduling must go through:
natural language -> intent extraction -> structured command -> validation ->
service -> confirmation/mutation, and that pipeline will call into this
layer, not bypass it.
"""
from datetime import datetime   
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import CalendarAccount, CalendarEvent, User
from app.schemas.calendar import (
    CalendarEventCreate,
    CalendarEventRead,
    CalendarEventUpdate,
)

router = APIRouter(tags=["calendar"])


@router.post("/calendar-events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    data = payload.model_dump()
    _validate_calendar_account(db, data.get("calendar_account_id"), current_user.id)
    event = CalendarEvent(user_id=current_user.id, source="local", **data)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/calendar-events", response_model=list[CalendarEventRead])
def list_calendar_events(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    event_type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarEvent]:
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == current_user.id)

    if start is not None:
        if start.tzinfo is None:
            raise HTTPException(status_code=422, detail="start must be timezone-aware")
        stmt = stmt.where(CalendarEvent.end_at >= start)
    if end is not None:
        if end.tzinfo is None:
            raise HTTPException(status_code=422, detail="end must be timezone-aware")
        stmt = stmt.where(CalendarEvent.start_at <= end)
    if event_type is not None:
        stmt = stmt.where(CalendarEvent.event_type == event_type)

    stmt = stmt.order_by(CalendarEvent.start_at.asc())
    return list(db.scalars(stmt).all())


@router.get("/calendar-events/{event_id}", response_model=CalendarEventRead)
def get_calendar_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    return _get_owned(db, event_id, current_user.id)


@router.patch("/calendar-events/{event_id}", response_model=CalendarEventRead)
def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    event = _get_owned(db, event_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)

    if "calendar_account_id" in data:
        _validate_calendar_account(db, data["calendar_account_id"], current_user.id)

    new_start = data.get("start_at", event.start_at)
    new_end = data.get("end_at", event.end_at)
    if new_end <= new_start:
        raise HTTPException(status_code=422, detail="end_at must be after start_at")

    _apply_updates(event, data)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/calendar-events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    event = _get_owned(db, event_id, current_user.id)
    db.delete(event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_owned(db: Session, event_id: int, user_id: int) -> CalendarEvent:
    event = db.get(CalendarEvent, event_id)
    if event is None or event.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found")
    return event


def _validate_calendar_account(db: Session, calendar_account_id: int | None, user_id: int) -> None:
    if calendar_account_id is None:
        return
    account = db.get(CalendarAccount, calendar_account_id)
    if account is None or account.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid calendar_account_id")


def _apply_updates(item, updates: dict) -> None:
    for field, value in updates.items():
        setattr(item, field, value)