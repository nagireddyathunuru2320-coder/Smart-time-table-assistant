from datetime import datetime, timedelta, timezone

from app.scheduling.allocation import StudyNeed, allocate_study_blocks
from app.scheduling.free_slots import FreeSlot


def _slot(start_h, end_h, day=1):
    base = datetime(2026, 9, day, tzinfo=timezone.utc)
    return FreeSlot(start=base.replace(hour=start_h), end=base.replace(hour=end_h))


def test_allocates_full_need_into_single_slot():
    need = StudyNeed(
        entity_type="task",
        entity_id=1,
        title="Essay",
        remaining_minutes=60,
        deadline=datetime(2026, 9, 5, tzinfo=timezone.utc),
        priority=3,
    )
    blocks, unmet = allocate_study_blocks(
        needs=[need],
        free_slots=[_slot(9, 22)],
        max_session_minutes=90,
        break_minutes=10,
        min_session_minutes=25,
    )
    assert unmet == {}
    assert len(blocks) == 1
    assert blocks[0].start.hour == 9
    assert (blocks[0].end - blocks[0].start).total_seconds() / 60 == 60


def test_splits_need_larger_than_max_session_with_break():
    need = StudyNeed(
        entity_type="task",
        entity_id=1,
        title="Essay",
        remaining_minutes=150,
        deadline=datetime(2026, 9, 5, tzinfo=timezone.utc),
        priority=3,
    )
    blocks, unmet = allocate_study_blocks(
        needs=[need],
        free_slots=[_slot(9, 22)],
        max_session_minutes=90,
        break_minutes=10,
        min_session_minutes=25,
    )
    assert unmet == {}
    assert len(blocks) == 2
    assert (blocks[0].end - blocks[0].start).total_seconds() / 60 == 90
    assert blocks[1].start == blocks[0].end + timedelta(minutes=10)
    assert (blocks[1].end - blocks[1].start).total_seconds() / 60 == 60


def test_more_urgent_need_wins_limited_slot():
    urgent = StudyNeed(
        entity_type="task",
        entity_id=1,
        title="Urgent",
        remaining_minutes=60,
        deadline=datetime(2026, 9, 2, tzinfo=timezone.utc),
        priority=3,
    )
    later = StudyNeed(
        entity_type="task",
        entity_id=2,
        title="Later",
        remaining_minutes=60,
        deadline=datetime(2026, 9, 10, tzinfo=timezone.utc),
        priority=3,
    )
    blocks, unmet = allocate_study_blocks(
        needs=[later, urgent],
        free_slots=[_slot(9, 10)],
        max_session_minutes=90,
        break_minutes=10,
        min_session_minutes=25,
    )
    assert len(blocks) == 1
    assert blocks[0].entity_id == 1
    assert unmet == {("task", 2): 60}


def test_need_with_deadline_before_any_slot_is_fully_unmet():
    need = StudyNeed(
        entity_type="exam",
        entity_id=9,
        title="Physics final",
        remaining_minutes=120,
        deadline=datetime(2026, 9, 1, tzinfo=timezone.utc),
        priority=5,
    )
    blocks, unmet = allocate_study_blocks(
        needs=[need],
        free_slots=[_slot(9, 22, day=2)],
        max_session_minutes=90,
        break_minutes=10,
        min_session_minutes=25,
    )
    assert blocks == []
    assert unmet == {("exam", 9): 120}


def test_slot_shorter_than_min_session_is_skipped():
    need = StudyNeed(
        entity_type="task",
        entity_id=1,
        title="Quick read",
        remaining_minutes=30,
        deadline=datetime(2026, 9, 5, tzinfo=timezone.utc),
        priority=3,
    )
    tiny = FreeSlot(
        start=datetime(2026, 9, 1, 9, 0, tzinfo=timezone.utc),
        end=datetime(2026, 9, 1, 9, 10, tzinfo=timezone.utc),
    )
    blocks, unmet = allocate_study_blocks(
        needs=[need],
        free_slots=[tiny, _slot(14, 22)],
        max_session_minutes=90,
        break_minutes=10,
        min_session_minutes=25,
    )
    assert unmet == {}
    assert len(blocks) == 1
    assert blocks[0].start.hour == 14

