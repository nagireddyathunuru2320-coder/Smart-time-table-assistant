"""Generates in-app reminder notifications for upcoming task deadlines and
exams. Runs live at the start of GET /notifications, the same pattern used
for conflict detection.

A notification is created only once for each
(notification_type, related_entity_type, related_entity_id), regardless of
whether it is unread, read, or otherwise updated later.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Exam, Notification, Task, User

TASK_REMINDER_WINDOW = timedelta(hours=48)
EXAM_REMINDER_WINDOW = timedelta(days=3)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def sync_notifications_for_user(db: Session, user: User) -> None:
    now = datetime.now(timezone.utc)

    existing_keys = set(
        db.execute(
            select(
                Notification.notification_type,
                Notification.related_entity_type,
                Notification.related_entity_id,
            ).where(Notification.user_id == user.id)
        ).all()
    )

    tasks = list(
        db.scalars(
            select(Task).where(
                Task.user_id == user.id,
                Task.status != "completed",
                Task.deadline_at.is_not(None),
                Task.deadline_at > now,
                Task.deadline_at <= now + TASK_REMINDER_WINDOW,
            )
        ).all()
    )
    for task in tasks:
        key = ("task_deadline", "task", task.id)
        if key in existing_keys:
            continue
        deadline_at = _as_utc(task.deadline_at)
        hours_left = int((deadline_at - now).total_seconds() // 3600)
        db.add(
            Notification(
                user_id=user.id,
                channel="in_app",
                notification_type="task_deadline",
                title=f'Task due soon: "{task.title}"',
                body=f'"{task.title}" is due in about {hours_left} hours.',
                scheduled_for=now,
                sent_at=now,
                status="unread",
                related_entity_type="task",
                related_entity_id=task.id,
            )
        )
        existing_keys.add(key)

    exams = list(
        db.scalars(
            select(Exam).where(
                Exam.user_id == user.id,
                Exam.exam_at > now,
                Exam.exam_at <= now + EXAM_REMINDER_WINDOW,
            )
        ).all()
    )
    for exam in exams:
        key = ("exam_reminder", "exam", exam.id)
        if key in existing_keys:
            continue
        exam_at = _as_utc(exam.exam_at)
        days_left = (exam_at.date() - now.date()).days
        db.add(
            Notification(
                user_id=user.id,
                channel="in_app",
                notification_type="exam_reminder",
                title=f'Exam coming up: "{exam.title}"',
                body=f'"{exam.title}" is in {days_left} day{"s" if days_left != 1 else ""}.',
                scheduled_for=now,
                sent_at=now,
                status="unread",
                related_entity_type="exam",
                related_entity_id=exam.id,
            )
        )
        existing_keys.add(key)

    db.commit()
