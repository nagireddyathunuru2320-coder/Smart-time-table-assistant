"""Orchestrates the AI assistant conversation pipeline.

natural language -> intent extraction -> structured command -> validation ->
confirmation -> service/mutation.

The AI layer never writes to the database directly. It only ever proposes a
structured command (stored on the assistant's AssistantMessage row with
validation_status="awaiting_confirmation"); the actual mutation only runs
after the user explicitly confirms, and reuses the EXACT SAME Pydantic
schemas (TaskCreate, CalendarEventCreate) used by the regular CRUD routers,
so anything the assistant creates is validated identically to anything
created through the normal UI.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.commands import build_command
from app.ai.provider import get_provider
from app.models import (
    AssistantConversation,
    AssistantMessage,
    CalendarEvent,
    Task,
    User,
    UserPreference,
)
from app.schemas.academic import TaskCreate
from app.schemas.calendar import CalendarEventCreate
from app.scheduling.free_slots import find_free_slots
from app.services.study_allocation_service import generate_study_plan


def get_or_create_conversation(
    db: Session, user: User, conversation_id: int | None
) -> AssistantConversation:
    if conversation_id is not None:
        conv = db.get(AssistantConversation, conversation_id)
        if conv is None or conv.user_id != user.id:
            raise ValueError("Conversation not found")
        return conv
    conv = AssistantConversation(user_id=user.id)
    db.add(conv)
    db.flush()
    return conv


def _last_pending_command(db: Session, conversation_id: int) -> AssistantMessage | None:
    return db.scalar(
        select(AssistantMessage)
        .where(
            AssistantMessage.conversation_id == conversation_id,
            AssistantMessage.role == "assistant",
            AssistantMessage.validation_status == "awaiting_confirmation",
        )
        .order_by(AssistantMessage.id.desc())
        .limit(1)
    )


def _execute_command(db: Session, user: User, command_type: str, payload: dict) -> str:
    if command_type == "create_task":
        validated = TaskCreate(**payload)
        task = Task(user_id=user.id, **validated.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)
        return f'Created task "{task.title}".'

    if command_type == "create_event":
        validated = CalendarEventCreate(**payload)
        data = validated.model_dump()
        event = CalendarEvent(
            user_id=user.id,
            source="local",
            title=data["title"],
            description=data.get("description"),
            location=data.get("location"),
            event_type=data["event_type"],
            start_at=data["start_at"].astimezone(timezone.utc),
            end_at=data["end_at"].astimezone(timezone.utc),
            timezone=user.timezone,
            all_day=data["all_day"],
            priority=data["priority"],
            is_busy=data["is_busy"],
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return f'Created event "{event.title}".'

    if command_type == "generate_study_plan":
        result = generate_study_plan(db, user, horizon_days=payload.get("days", 14))
        if result.unmet:
            unmet_text = "; ".join(
                f'{u["title"]} ({u["unmet_minutes"]} min short)' for u in result.unmet
            )
            return f"Scheduled {len(result.created)} study blocks. Couldn't fully fit: {unmet_text}."
        return f"Scheduled {len(result.created)} study blocks over the next {result.horizon_days} days."

    return "I couldn't complete that action."


def _handle_free_time_query(db: Session, user: User, conversation: AssistantConversation) -> AssistantMessage:
    try:
        user_tz = ZoneInfo(user.timezone)
    except Exception:
        user_tz = ZoneInfo("UTC")

    preferences = db.scalar(select(UserPreference).where(UserPreference.user_id == user.id))
    range_start = datetime.now(timezone.utc)
    range_end = range_start + timedelta(days=7)
    events = list(
        db.scalars(
            select(CalendarEvent).where(
                CalendarEvent.user_id == user.id,
                CalendarEvent.end_at > range_start,
                CalendarEvent.start_at < range_end,
            )
        ).all()
    )
    slots = find_free_slots(
        range_start=range_start,
        range_end=range_end,
        busy_events=events,
        preferred_study_start=preferences.preferred_study_start,
        preferred_study_end=preferences.preferred_study_end,
        min_session_minutes=preferences.min_session_minutes,
        user_timezone=user.timezone,
    )
    if not slots:
        reply = "You don't have any free study time in the next 7 days that meets your minimum session length."
    else:
        lines = [
            f'- {s.start.astimezone(user_tz).strftime("%a %b %d, %H:%M")} to '
            f'{s.end.astimezone(user_tz).strftime("%H:%M")} ({s.duration_minutes} min)'
            for s in slots[:5]
        ]
        reply = "Here's your free time in the next 7 days:\n" + "\n".join(lines)

    assistant_msg = AssistantMessage(conversation_id=conversation.id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


def handle_message(
    db: Session, user: User, conversation: AssistantConversation, text: str
) -> AssistantMessage:
    user_msg = AssistantMessage(conversation_id=conversation.id, role="user", content=text)
    db.add(user_msg)
    db.flush()

    try:
        user_tz = ZoneInfo(user.timezone)
    except Exception:
        user_tz = ZoneInfo("UTC")
    now = datetime.now(user_tz)

    parsed = get_provider().parse(text, now)

    if parsed.intent == "confirm":
        pending = _last_pending_command(db, conversation.id)
        if pending is None or not pending.structured_intent:
            reply = "There's nothing pending to confirm right now."
            assistant_msg = AssistantMessage(conversation_id=conversation.id, role="assistant", content=reply)
        else:
            stored = json.loads(pending.structured_intent)
            result_text = _execute_command(db, user, stored["command_type"], stored["payload"])
            pending.validation_status = "confirmed_executed"
            assistant_msg = AssistantMessage(
                conversation_id=conversation.id, role="assistant", content=result_text, validation_status="executed"
            )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        return assistant_msg

    if parsed.intent == "cancel":
        pending = _last_pending_command(db, conversation.id)
        if pending is not None:
            pending.validation_status = "cancelled"
        assistant_msg = AssistantMessage(conversation_id=conversation.id, role="assistant", content="Okay, cancelled.")
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        return assistant_msg

    if parsed.intent == "free_time_query":
        return _handle_free_time_query(db, user, conversation)

    if parsed.intent == "unknown":
        reply = (
            "I didn't quite understand that. Try things like:\n"
            '- "add a task to finish my essay by friday, high priority"\n'
            '- "schedule a meeting from 2pm to 4pm tomorrow"\n'
            '- "when am I free this week"\n'
            '- "generate my study plan"'
        )
        assistant_msg = AssistantMessage(conversation_id=conversation.id, role="assistant", content=reply)
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        return assistant_msg

    command, clarification = build_command(parsed)

    if clarification is not None:
        assistant_msg = AssistantMessage(conversation_id=conversation.id, role="assistant", content=clarification)
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        return assistant_msg

    assert command is not None
    assistant_msg = AssistantMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=command.preview + ' (reply "yes" to confirm, or "cancel")',
        structured_intent=json.dumps({"command_type": command.command_type, "payload": command.payload}),
        validation_status="awaiting_confirmation",
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
