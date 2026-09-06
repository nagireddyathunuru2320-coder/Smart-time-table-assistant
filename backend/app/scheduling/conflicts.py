"""Pure conflict-detection logic: finds overlapping calendar events.

No DB access here — this module only works with in-memory CalendarEvent
objects so it can be unit tested without a database.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.models import CalendarEvent


@dataclass
class OverlapPair:
    event_a: CalendarEvent
    event_b: CalendarEvent
    overlap_minutes: int


def find_overlapping_events(events: list[CalendarEvent]) -> list[OverlapPair]:
    """Return pairs of busy events whose time ranges overlap.

    Only events with is_busy=True are considered (a "free"/non-busy event,
    e.g. a personal reminder, should not block other scheduling).
    O(n log n): sort by start_at, then sweep comparing each event against
    the ones that follow it until a following event starts after the
    current one ends.
    """
    busy = sorted((e for e in events if e.is_busy), key=lambda e: e.start_at)
    pairs: list[OverlapPair] = []

    for i in range(len(busy)):
        a = busy[i]
        for j in range(i + 1, len(busy)):
            b = busy[j]
            if b.start_at >= a.end_at:
                break
            overlap_start = max(a.start_at, b.start_at)
            overlap_end = min(a.end_at, b.end_at)
            overlap_minutes = int((overlap_end - overlap_start).total_seconds() // 60)
            if overlap_minutes > 0:
                pairs.append(OverlapPair(event_a=a, event_b=b, overlap_minutes=overlap_minutes))

    return pairs


def severity_for_overlap(overlap_minutes: int) -> str:
    if overlap_minutes >= 60:
        return "high"
    if overlap_minutes >= 15:
        return "medium"
    return "low"

