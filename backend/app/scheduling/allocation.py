"""Pure greedy study-block allocation logic.

Given a list of study "needs" (tasks/exams that require study time before a
deadline) and a shared pool of free time slots, greedily assigns time
chunks to each need - most urgent (soonest deadline, then highest priority)
first - respecting a maximum session length and a break between sessions.

No DB access here so this can be unit tested in isolation.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.scheduling.free_slots import FreeSlot


@dataclass
class StudyNeed:
    entity_type: str  # "task" | "exam"
    entity_id: int
    title: str
    remaining_minutes: int
    deadline: datetime
    priority: int


@dataclass
class AllocatedBlock:
    entity_type: str
    entity_id: int
    title: str
    start: datetime
    end: datetime


def _to_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def allocate_study_blocks(
    *,
    needs: list[StudyNeed],
    free_slots: list[FreeSlot],
    max_session_minutes: int,
    break_minutes: int,
    min_session_minutes: int,
) -> tuple[list[AllocatedBlock], dict[tuple[str, int], int]]:
    """Returns (allocated_blocks, unmet) where unmet maps
    (entity_type, entity_id) -> minutes that could not be scheduled before
    the deadline (fully-met needs are omitted from the dict).
    """
    sorted_needs = sorted(needs, key=lambda n: (_to_aware(n.deadline), -n.priority))

    working_slots: list[list[datetime]] = sorted(
        ([_to_aware(s.start), _to_aware(s.end)] for s in free_slots), key=lambda s: s[0]
    )

    blocks: list[AllocatedBlock] = []
    unmet: dict[tuple[str, int], int] = {}

    for need in sorted_needs:
        remaining = need.remaining_minutes
        deadline = _to_aware(need.deadline)
        i = 0
        while remaining > 0 and i < len(working_slots):
            slot_start, slot_end = working_slots[i]

            if slot_start >= deadline:
                # Slots are sorted by start; every later slot also starts
                # at or after the deadline, so nothing further can help.
                break

            usable_end = min(slot_end, deadline)
            slot_minutes = int((usable_end - slot_start).total_seconds() // 60)

            if slot_minutes < min_session_minutes:
                i += 1
                continue

            chunk = min(remaining, max_session_minutes, slot_minutes)
            block_end = slot_start + timedelta(minutes=chunk)

            blocks.append(
                AllocatedBlock(
                    entity_type=need.entity_type,
                    entity_id=need.entity_id,
                    title=need.title,
                    start=slot_start,
                    end=block_end,
                )
            )
            remaining -= chunk

            new_start = block_end + timedelta(minutes=break_minutes)
            if new_start < slot_end:
                working_slots[i][0] = new_start
            else:
                working_slots.pop(i)

        if remaining > 0:
            unmet[(need.entity_type, need.entity_id)] = remaining

    return blocks, unmet

