"""Combines free-time detection with tasks/exams to auto-generate study
blocks on the calendar.

Triggered by an explicit user action (POST /schedule/generate-study-plan),
never automatically.

BUG FIX 1: the stale-block cleanup used to delete only blocks with
start_at >= now (using the *current* call's "now"). Since real time always
passes between two calls, a block created moments ago in a previous run
(e.g. starting at 8:27) can have a start_at that is now in the past
relative to a *second* call's "now" (e.g. 8:29) — even though it's still
sitting on the calendar and hasn't actually happened. That block was
neither deleted nor counted as busy, so a fresh block could be scheduled
directly on top of it, creating a genuine overlap (visible as a Conflict).
Fix: delete any of this user's ai_generated study_block events that
haven't finished yet (end_at > now), not just ones starting after now.

BUG FIX 2: exams were not treated as busy time when computing free slots,
because they live in a separate `exams` table and are never written to
calendar_events. This let study blocks get scheduled directly on top of
a user's actual exam time. Fix: synthesize busy time windows from each
upcoming exam (exam_at to exam_at + duration_minutes) and include them
alongside real calendar events when computing free time.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CalendarEvent, Exam, Task, User, UserPreference
from app.scheduling.allocation import StudyNeed, allocate_study_blocks
from app.scheduling.free_slots import find_free_slots


@dataclass
class StudyPlanResult:
    horizon_days: int
    created: list[CalendarEvent] = field(default_factory=list)
    unmet: list[dict] = field(default_factory=list)
    needs_considered: list[dict] = field(default_factory=list)


def generate_study_plan(db: Session, user: User, horizon_days: int = 14) -> StudyPlanResult:
    now = datetime.now(timezone.utc)
    range_end = now + timedelta(days=horizon_days)

    preferences = db.scalar(
        select(UserPreference).where(UserPreference.user_id == user.id)
    )
    if preferences is None:
        return StudyPlanResult(horizon_days=horizon_days)

    tasks = list(
        db.scalars(
            select(Task).where(
                Task.user_id == user.id,
                Task.status != "completed",
                Task.deadline_at.is_not(None),
                Task.deadline_at > now,
            )
        ).all()
    )
    exams = list(
        db.scalars(
            select(Exam).where(Exam.user_id == user.id, Exam.exam_at > now)
        ).all()
    )

    needs: list[StudyNeed] = []
    for task in tasks:
        remaining = max(task.estimated_minutes - task.completed_minutes, 0)
        if remaining <= 0:
            continue
        needs.append(
            StudyNeed(
                entity_type="task",
                entity_id=task.id,
                title=task.title,
                remaining_minutes=remaining,
                deadline=task.deadline_at,
                priority=task.priority,
            )
        )
    for exam in exams:
        if exam.study_required_minutes <= 0:
            continue
        needs.append(
            StudyNeed(
                entity_type="exam",
                entity_id=exam.id,
                title=exam.title,
                remaining_minutes=exam.study_required_minutes,
                deadline=exam.exam_at,
                priority=exam.priority,
            )
        )

    # Real calendar events count as busy, except this user's own previously
    # auto-generated study blocks (those are being regenerated, not real
    # obstacles).
    existing_events = list(
        db.scalars(
            select(CalendarEvent).where(
                CalendarEvent.user_id == user.id,
                CalendarEvent.end_at > now,
                CalendarEvent.start_at < range_end,
                ~(
                    (CalendarEvent.source == "ai_generated")
                    & (CalendarEvent.event_type == "study_block")
                ),
            )
        ).all()
    )

    # Also block out each upcoming exam's own time window, even though exams
    # aren't stored in calendar_events. These synthetic events are only used
    # for this free-time calculation.
    exam_busy_blocks = [
        CalendarEvent(
            user_id=user.id,
            title=f"[exam] {exam.title}",
            start_at=exam.exam_at,
            end_at=exam.exam_at + timedelta(minutes=exam.duration_minutes),
            is_busy=True,
            event_type="exam",
            timezone=user.timezone,
            all_day=False,
            source="local",
            priority=exam.priority,
        )
        for exam in exams
    ]

    free_slots = find_free_slots(
        range_start=now,
        range_end=range_end,
        busy_events=existing_events + exam_busy_blocks,
        preferred_study_start=preferences.preferred_study_start,
        preferred_study_end=preferences.preferred_study_end,
        min_session_minutes=preferences.min_session_minutes,
        user_timezone=user.timezone,
    )

    allocated_blocks, unmet = allocate_study_blocks(
        needs=needs,
        free_slots=free_slots,
        max_session_minutes=preferences.max_session_minutes,
        break_minutes=preferences.break_minutes,
        min_session_minutes=preferences.min_session_minutes,
    )

    stale = db.scalars(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.source == "ai_generated",
            CalendarEvent.event_type == "study_block",
            CalendarEvent.end_at > now,
        )
    ).all()
    for event in stale:
        db.delete(event)
    db.flush()

    created: list[CalendarEvent] = []
    for block in allocated_blocks:
        event = CalendarEvent(
            user_id=user.id,
            title=f"Study: {block.title}",
            description=f"Auto-generated study block for {block.entity_type} #{block.entity_id}.",
            event_type="study_block",
            start_at=block.start,
            end_at=block.end,
            timezone=user.timezone,
            all_day=False,
            source="ai_generated",
            external_event_id=f"studyplan:{block.entity_type}:{block.entity_id}",
            priority=3,
            is_busy=True,
        )
        db.add(event)
        created.append(event)

    db.commit()
    for event in created:
        db.refresh(event)

    needs_by_key = {(n.entity_type, n.entity_id): n.title for n in needs}
    unmet_list = [
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "title": needs_by_key.get((entity_type, entity_id), ""),
            "unmet_minutes": minutes,
        }
        for (entity_type, entity_id), minutes in unmet.items()
    ]

    needs_considered_list = [
        {
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "title": n.title,
            "deadline": n.deadline.isoformat(),
            "remaining_minutes": n.remaining_minutes,
            "priority": n.priority,
        }
        for n in sorted(needs, key=lambda n: (n.deadline, -n.priority))
    ]

    return StudyPlanResult(
        horizon_days=horizon_days,
        created=created,
        unmet=unmet_list,
        needs_considered=needs_considered_list,
    )
