"""Reconciles detected calendar overlaps with the conflicts table.

Called at the start of GET /conflicts so the list is always fresh.

Key invariant: a conflict is only (re-)created for a given pair of events if
no "active" conflict already exists for that exact pair. "Active" means
status is "open" or "dismissed" — a dismissal is a user decision and must
not be silently overwritten by a fresh row on the next sync. A new conflict
is only created when a pair's previous conflict was "resolved" (the overlap
genuinely went away) and the pair overlaps again — a real new occurrence.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CalendarEvent, Conflict
from app.scheduling.conflicts import find_overlapping_events, severity_for_overlap


def _pair_key(id_a: int, id_b: int) -> tuple[int, int]:
    return (id_a, id_b) if id_a < id_b else (id_b, id_a)


def sync_conflicts_for_user(db: Session, user_id: int) -> None:
    events = list(
        db.scalars(select(CalendarEvent).where(CalendarEvent.user_id == user_id)).all()
    )
    pairs = find_overlapping_events(events)
    current_keys = {_pair_key(p.event_a.id, p.event_b.id) for p in pairs}

    all_conflicts = list(
        db.scalars(
            select(Conflict).where(
                Conflict.user_id == user_id,
                Conflict.conflict_type == "calendar_overlap",
            )
        ).all()
    )

    active_by_key: dict[tuple[int, int], Conflict] = {}
    for c in all_conflicts:
        if c.affected_entity_id is None or c.secondary_entity_id is None:
            continue
        key = _pair_key(c.affected_entity_id, c.secondary_entity_id)
        if c.status in ("open", "dismissed"):
            active_by_key[key] = c

    # Auto-resolve conflicts that are still "open" but no longer overlap.
    # (Dismissed ones are left alone — that was a deliberate user choice.)
    for key, conflict in active_by_key.items():
        if key not in current_keys and conflict.status == "open":
            conflict.status = "resolved"

    # Create a new conflict only for pairs with no active (open/dismissed)
    # record yet.
    for pair in pairs:
        key = _pair_key(pair.event_a.id, pair.event_b.id)
        if key in active_by_key:
            continue
        db.add(
            Conflict(
                user_id=user_id,
                conflict_type="calendar_overlap",
                severity=severity_for_overlap(pair.overlap_minutes),
                status="open",
                title=f'"{pair.event_a.title}" overlaps "{pair.event_b.title}"',
                description=(
                    f"These two events overlap by {pair.overlap_minutes} minutes: "
                    f'"{pair.event_a.title}" ({pair.event_a.start_at.isoformat()} - '
                    f'{pair.event_a.end_at.isoformat()}) and "{pair.event_b.title}" '
                    f'({pair.event_b.start_at.isoformat()} - {pair.event_b.end_at.isoformat()}).'
                ),
                affected_entity_type="calendar_event",
                affected_entity_id=pair.event_a.id,
                secondary_entity_id=pair.event_b.id,
            )
        )

    db.commit()
