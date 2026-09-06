"""Fetches the data compute_analytics() needs and resolves each
ai_generated study block back to the subject of its underlying task/exam
(study blocks don't carry subject_id directly - it's derived via the
external_event_id "studyplan:{entity_type}:{entity_id}" convention already
used by study_allocation_service.py).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analytics.compute import (
    AnalyticsSummary,
    ExamInfo,
    StudyBlockInfo,
    TaskInfo,
    compute_analytics,
)
from app.models import CalendarEvent, Exam, Subject, Task, User


def get_analytics_summary(db: Session, user: User, trend_days: int = 14) -> AnalyticsSummary:
    now = datetime.now(timezone.utc)

    tasks = list(db.scalars(select(Task).where(Task.user_id == user.id)).all())
    exams = list(db.scalars(select(Exam).where(Exam.user_id == user.id)).all())
    subjects = list(db.scalars(select(Subject).where(Subject.user_id == user.id)).all())
    subject_lookup = {s.id: (s.name, s.color) for s in subjects}

    tasks_by_id = {t.id: t for t in tasks}
    exams_by_id = {e.id: e for e in exams}

    study_events = list(
        db.scalars(
            select(CalendarEvent).where(
                CalendarEvent.user_id == user.id,
                CalendarEvent.event_type == "study_block",
                CalendarEvent.source == "ai_generated",
            )
        ).all()
    )

    study_blocks: list[StudyBlockInfo] = []
    for event in study_events:
        subject_id = None
        if event.external_event_id and event.external_event_id.startswith("studyplan:"):
            parts = event.external_event_id.split(":")
            if len(parts) == 3:
                entity_type, entity_id_str = parts[1], parts[2]
                try:
                    entity_id = int(entity_id_str)
                except ValueError:
                    entity_id = None
                if entity_id is not None:
                    if entity_type == "task" and entity_id in tasks_by_id:
                        subject_id = tasks_by_id[entity_id].subject_id
                    elif entity_type == "exam" and entity_id in exams_by_id:
                        subject_id = exams_by_id[entity_id].subject_id
        study_blocks.append(
            StudyBlockInfo(start_at=event.start_at, end_at=event.end_at, subject_id=subject_id)
        )

    task_infos = [TaskInfo(status=t.status, deadline_at=t.deadline_at) for t in tasks]
    exam_infos = [ExamInfo(exam_at=e.exam_at, title=e.title, id=e.id) for e in exams]

    return compute_analytics(
        now=now,
        tasks=task_infos,
        exams=exam_infos,
        study_blocks=study_blocks,
        weekly_goal_minutes=user.study_goal_minutes_per_week,
        subject_lookup=subject_lookup,
        trend_days=trend_days,
    )
