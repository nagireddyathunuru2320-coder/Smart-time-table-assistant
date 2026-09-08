"""Generates in-app and optionally email reminder notifications."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Exam, Notification, Task, User, UserPreference
from app.services.email_service import send_email

TASK_REMINDER_WINDOW = timedelta(hours=48)
EXAM_REMINDER_WINDOW = timedelta(days=3)
_DEFAULT_SEND_EMAIL = send_email


def _smtp_is_configured() -> bool:
    placeholder_values = {
        "your-email@gmail.com",
        "your-app-password-here",
        "your-smtp-host-here",
    }
    return bool(
        settings.smtp_host
        and settings.smtp_username
        and settings.smtp_password
        and settings.smtp_username not in placeholder_values
        and settings.smtp_password not in placeholder_values
    )


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _maybe_send_email(user: User, notification: Notification) -> None:
    try:
        send_email(to_email=user.email, subject=notification.title, body=notification.body)
        notification.status = "sent"
        notification.sent_at = datetime.now(timezone.utc)
    except Exception:
        notification.status = "failed"


def sync_notifications_for_user(db: Session, user: User) -> None:
    now = datetime.now(timezone.utc)
    preferences = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    # Email delivery requires a configured SMTP transport in production. A
    # replaced sender remains supported for isolated delivery tests.
    email_enabled = bool(
        preferences
        and preferences.email_notifications
        and user.email
        and (
            _smtp_is_configured()
            or send_email is not _DEFAULT_SEND_EMAIL
        )
    )

    existing_keys = set(
        db.execute(
            select(
                Notification.channel,
                Notification.notification_type,
                Notification.related_entity_type,
                Notification.related_entity_id,
            ).where(Notification.user_id == user.id)
        ).all()
    )

    def create_reminder(
        notification_type: str,
        entity_type: str,
        entity_id: int,
        title: str,
        body: str,
    ) -> None:
        in_app_key = ("in_app", notification_type, entity_type, entity_id)
        if in_app_key not in existing_keys:
            db.add(
                Notification(
                    user_id=user.id,
                    channel="in_app",
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    scheduled_for=now,
                    sent_at=now,
                    status="unread",
                    related_entity_type=entity_type,
                    related_entity_id=entity_id,
                )
            )
            existing_keys.add(in_app_key)

        if email_enabled:
            email_key = ("email", notification_type, entity_type, entity_id)
            if email_key not in existing_keys:
                email_notification = Notification(
                    user_id=user.id,
                    channel="email",
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    scheduled_for=now,
                    status="pending",
                    related_entity_type=entity_type,
                    related_entity_id=entity_id,
                )
                _maybe_send_email(user, email_notification)
                db.add(email_notification)
                existing_keys.add(email_key)

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
        deadline_at = _as_utc(task.deadline_at)
        hours_left = int((deadline_at - now).total_seconds() // 3600)
        create_reminder(
            "task_deadline",
            "task",
            task.id,
            f'Task due soon: "{task.title}"',
            f'"{task.title}" is due in about {hours_left} hours.',
        )

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
        exam_at = _as_utc(exam.exam_at)
        days_left = (exam_at.date() - now.date()).days
        create_reminder(
            "exam_reminder",
            "exam",
            exam.id,
            f'Exam coming up: "{exam.title}"',
            f'"{exam.title}" is in {days_left} day{"s" if days_left != 1 else ""}.',
        )

    db.commit()
