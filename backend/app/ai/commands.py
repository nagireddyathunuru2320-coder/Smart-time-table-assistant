"""Builds a structured, previewable command from a ParsedIntent.

This is the "structured command" and "validation preview" stage of the
pipeline: natural language -> intent extraction -> structured command ->
validation -> service -> confirmation/mutation. Nothing here touches the
database.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.ai.intent_parser import ParsedIntent


@dataclass
class StructuredCommand:
    command_type: str  # create_task | create_event | generate_study_plan
    payload: dict
    preview: str


def build_command(parsed: ParsedIntent) -> tuple[StructuredCommand | None, str | None]:
    """Returns (command, clarification_message) — exactly one is not None."""
    if parsed.intent == "create_task":
        if not parsed.title:
            return None, "What should I title this task?"
        deadline = parsed.deadline or (datetime.now(timezone.utc) + timedelta(days=3))
        payload = {
            "title": parsed.title,
            "priority": parsed.priority or 3,
            "deadline_at": deadline.isoformat(),
            "task_type": "assignment",
            "status": "pending",
        }
        preview = (
            f'Create task "{parsed.title}" due {deadline.strftime("%a %b %d, %H:%M")} '
            f'(priority {payload["priority"]}/5)?'
        )
        return StructuredCommand("create_task", payload, preview), None

    if parsed.intent == "create_event":
        if not parsed.title:
            return None, "What should I title this event?"
        if not parsed.start or not parsed.end:
            return None, "What time should this event be? (e.g. 'at 3pm' or 'from 2pm to 4pm')"
        payload = {
            "title": parsed.title,
            "start_at": parsed.start.isoformat(),
            "end_at": parsed.end.isoformat(),
            "event_type": "personal",
            "timezone": "UTC",
            "all_day": False,
            "priority": 3,
            "is_busy": True,
        }
        preview = (
            f'Create event "{parsed.title}" from '
            f'{parsed.start.strftime("%a %b %d, %H:%M")} to {parsed.end.strftime("%H:%M")}?'
        )
        return StructuredCommand("create_event", payload, preview), None

    if parsed.intent == "generate_study_plan":
        payload = {"days": 14}
        preview = "Generate a study plan for the next 14 days based on your tasks and exams?"
        return StructuredCommand("generate_study_plan", payload, preview), None

    return None, None
