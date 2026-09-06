"""Mock (pattern/keyword-based) natural language intent parser.

Zero external calls, zero cost — satisfies the project's mock/free-first
requirement. A real LLM-backed parser can later be swapped in behind the
same parse_intent(text, now) -> ParsedIntent interface (see ai/provider.py)
without changing any other file.

Known limitation: this is intentionally simple pattern matching, not true
NLU. It handles a handful of common phrasings well; anything else falls
through to intent="unknown" with a helpful fallback message.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

TASK_TRIGGER_NOUNS = ["task", "todo", "to-do", "assignment"]
EVENT_TRIGGER_WORDS = ["schedule", "event", "meeting", "book", "class", "add to calendar"]
CONFIRM_WORDS = ["yes", "confirm", "do it", "go ahead", "sounds good", "yep", "sure", "ok", "okay"]
CANCEL_WORDS = ["no", "cancel", "nevermind", "never mind", "stop"]

PRIORITY_HIGH = ["high priority", "urgent", "asap", "important"]
PRIORITY_LOW = ["low priority", "whenever", "not urgent"]

LEADING_ACTION_WORDS = [
    "add a", "add an", "add", "create a", "create an", "create",
    "schedule a", "schedule an", "schedule", "book a", "book an", "book",
    "remind me to", "set up a", "set up",
]

TIME_RE = re.compile(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", re.IGNORECASE)


@dataclass
class ParsedIntent:
    intent: str  # create_task | create_event | free_time_query | generate_study_plan | confirm | cancel | unknown
    title: str | None = None
    deadline: datetime | None = None
    start: datetime | None = None
    end: datetime | None = None
    priority: int | None = None
    raw_text: str = ""


def _extract_weekday_or_relative_date(text: str, now: datetime) -> datetime | None:
    lowered = text.lower()
    if "tomorrow" in lowered:
        return (now + timedelta(days=1)).replace(hour=23, minute=59, second=0, microsecond=0)
    if "today" in lowered:
        return now.replace(hour=23, minute=59, second=0, microsecond=0)
    match = re.search(r"in (\d+) days?", lowered)
    if match:
        return (now + timedelta(days=int(match.group(1)))).replace(
            hour=23, minute=59, second=0, microsecond=0
        )
    for i, day in enumerate(WEEKDAYS):
        if day in lowered:
            days_ahead = (i - now.weekday()) % 7
            days_ahead = days_ahead if days_ahead != 0 else 7
            return (now + timedelta(days=days_ahead)).replace(
                hour=23, minute=59, second=0, microsecond=0
            )
    return None


def _extract_times(text: str, base_date: datetime) -> list[datetime]:
    results = []
    for hour_s, minute_s, ampm in TIME_RE.findall(text):
        hour = int(hour_s) % 12
        if ampm.lower() == "pm":
            hour += 12
        minute = int(minute_s) if minute_s else 0
        results.append(base_date.replace(hour=hour, minute=minute, second=0, microsecond=0))
    return results


def _extract_priority(text: str) -> int | None:
    lowered = text.lower()
    if any(p in lowered for p in PRIORITY_HIGH):
        return 5
    if any(p in lowered for p in PRIORITY_LOW):
        return 1
    return None


def _strip_leading_action(text: str) -> str:
    cleaned = text.strip()
    lowered = cleaned.lower()
    for phrase in sorted(LEADING_ACTION_WORDS, key=len, reverse=True):
        if lowered.startswith(phrase + " "):
            return cleaned[len(phrase):].strip()
    return cleaned


def _strip_leading_noun(text: str, nouns: list[str]) -> str:
    cleaned = text.strip()
    lowered = cleaned.lower()
    for noun in sorted(nouns, key=len, reverse=True):
        if lowered.startswith(noun + " ") or lowered == noun:
            cleaned = cleaned[len(noun):].strip()
            break
    cleaned = re.sub(r"^(to|:|-)\s*", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip(" .,")


def parse_intent(text: str, now: datetime) -> ParsedIntent:
    lowered = text.lower().strip()
    word_count = len(lowered.split())

    if any(w in lowered for w in CONFIRM_WORDS) and word_count <= 4:
        return ParsedIntent(intent="confirm", raw_text=text)
    if any(w in lowered for w in CANCEL_WORDS) and word_count <= 4:
        return ParsedIntent(intent="cancel", raw_text=text)

    if "free" in lowered and ("when" in lowered or "time" in lowered or "am i" in lowered):
        return ParsedIntent(intent="free_time_query", raw_text=text)

    if "study plan" in lowered or ("generate" in lowered and "plan" in lowered):
        return ParsedIntent(intent="generate_study_plan", raw_text=text)

    if any(t in lowered for t in TASK_TRIGGER_NOUNS):
        deadline = _extract_weekday_or_relative_date(text, now)
        priority = _extract_priority(text)
        title = _strip_leading_noun(_strip_leading_action(text), TASK_TRIGGER_NOUNS)
        title = re.split(
            r"\b(by|due|before|priority|high priority|low priority)\b", title, flags=re.IGNORECASE
        )[0].strip(" .,")
        return ParsedIntent(
            intent="create_task", title=title or None, deadline=deadline, priority=priority, raw_text=text
        )

    if any(t in lowered for t in EVENT_TRIGGER_WORDS):
        times = _extract_times(text, now)
        deadline_date = _extract_weekday_or_relative_date(text, now) or now
        start = end = None
        if len(times) >= 2:
            start = times[0].replace(year=deadline_date.year, month=deadline_date.month, day=deadline_date.day)
            end = times[1].replace(year=deadline_date.year, month=deadline_date.month, day=deadline_date.day)
        elif len(times) == 1:
            start = times[0].replace(year=deadline_date.year, month=deadline_date.month, day=deadline_date.day)
            end = start + timedelta(hours=1)
        title = _strip_leading_action(text)
        title = re.split(r"\b(at|from|on|by)\b", title, flags=re.IGNORECASE)[0].strip(" .,")
        return ParsedIntent(intent="create_event", title=title or None, start=start, end=end, raw_text=text)

    return ParsedIntent(intent="unknown", raw_text=text)
