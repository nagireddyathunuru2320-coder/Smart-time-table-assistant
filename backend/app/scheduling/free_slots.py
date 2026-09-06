"""Pure free-time detection logic: computes open slots in a user's schedule.

No DB access here - operates on already-fetched CalendarEvent objects and a
user's preferences, so it can be unit tested without a database.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.models import CalendarEvent


@dataclass
class FreeSlot:
    start: datetime
    end: datetime

    @property
    def duration_minutes(self) -> int:
        return int((self.end - self.start).total_seconds() // 60)


def _parse_hhmm(value: str) -> time:
    hour, minute = value.split(":")
    return time(hour=int(hour), minute=int(minute))


def _to_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def find_free_slots(
    *,
    range_start: datetime,
    range_end: datetime,
    busy_events: list[CalendarEvent],
    preferred_study_start: str,
    preferred_study_end: str,
    min_session_minutes: int,
    user_timezone: str = "UTC",
) -> list[FreeSlot]:
    """Return free slots within [range_start, range_end) (both tz-aware),
    restricted to each day's preferred study window in the user's own
    timezone, with busy events subtracted out.

    Slots shorter than min_session_minutes are discarded as not useful.
    """
    if range_end <= range_start:
        return []

    try:
        tz = ZoneInfo(user_timezone)
    except Exception:
        tz = ZoneInfo("UTC")

    study_start_t = _parse_hhmm(preferred_study_start)
    study_end_t = _parse_hhmm(preferred_study_end)

    busy = sorted(
        (
            e
            for e in busy_events
            if e.is_busy and _to_aware(e.end_at) > range_start and _to_aware(e.start_at) < range_end
        ),
        key=lambda e: _to_aware(e.start_at),
    )

    slots: list[FreeSlot] = []
    local_start_date = range_start.astimezone(tz).date()
    local_end_date = range_end.astimezone(tz).date()

    current_day = local_start_date
    while current_day <= local_end_date:
        day_start_local = datetime.combine(current_day, study_start_t, tzinfo=tz)
        day_end_local = datetime.combine(current_day, study_end_t, tzinfo=tz)

        day_start = day_start_local.astimezone(range_start.tzinfo)
        day_end = day_end_local.astimezone(range_start.tzinfo)

        window_start = max(day_start, range_start)
        window_end = min(day_end, range_end)

        if window_end > window_start:
            slots.extend(
                _subtract_busy_from_window(window_start, window_end, busy, min_session_minutes)
            )

        current_day += timedelta(days=1)

    return slots


def _subtract_busy_from_window(
    window_start: datetime,
    window_end: datetime,
    busy: list[CalendarEvent],
    min_session_minutes: int,
) -> list[FreeSlot]:
    cursor = window_start
    result: list[FreeSlot] = []
    relevant = [
        e
        for e in busy
        if _to_aware(e.start_at) < window_end and _to_aware(e.end_at) > window_start
    ]

    for event in relevant:
        event_start = max(_to_aware(event.start_at), window_start)
        event_end = min(_to_aware(event.end_at), window_end)

        if event_start > cursor:
            gap_minutes = int((event_start - cursor).total_seconds() // 60)
            if gap_minutes >= min_session_minutes:
                result.append(FreeSlot(start=cursor, end=event_start))

        if event_end > cursor:
            cursor = event_end

    if window_end > cursor:
        gap_minutes = int((window_end - cursor).total_seconds() // 60)
        if gap_minutes >= min_session_minutes:
            result.append(FreeSlot(start=cursor, end=window_end))

    return result

