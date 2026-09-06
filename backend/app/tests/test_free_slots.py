from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models import CalendarEvent
from app.scheduling.free_slots import find_free_slots
from app.tests.conftest import auth_headers, register_user


def _event(start, end, is_busy=True):
    return CalendarEvent(
        user_id=1,
        title="x",
        start_at=start,
        end_at=end,
        is_busy=is_busy,
        event_type="academic",
        timezone="UTC",
        all_day=False,
        source="local",
        priority=3,
    )


def test_free_slots_full_window_when_no_events():
    day = datetime(2026, 9, 1, tzinfo=timezone.utc)
    slots = find_free_slots(
        range_start=day,
        range_end=day + timedelta(days=1),
        busy_events=[],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert len(slots) == 1
    assert slots[0].duration_minutes == 13 * 60


def test_free_slots_subtracts_busy_event_in_middle():
    day = datetime(2026, 9, 1, tzinfo=timezone.utc)
    busy = _event(
        datetime(2026, 9, 1, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 9, 1, 16, 0, tzinfo=timezone.utc),
    )
    slots = find_free_slots(
        range_start=day,
        range_end=day + timedelta(days=1),
        busy_events=[busy],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert len(slots) == 2
    assert slots[0].start.hour == 9 and slots[0].end.hour == 14
    assert slots[1].start.hour == 16 and slots[1].end.hour == 22


def test_free_slots_discards_gaps_shorter_than_min_session():
    day = datetime(2026, 9, 1, tzinfo=timezone.utc)
    busy_a = _event(
        datetime(2026, 9, 1, 9, 0, tzinfo=timezone.utc),
        datetime(2026, 9, 1, 13, 50, tzinfo=timezone.utc),
    )
    busy_b = _event(
        datetime(2026, 9, 1, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 9, 1, 22, 0, tzinfo=timezone.utc),
    )
    slots = find_free_slots(
        range_start=day,
        range_end=day + timedelta(days=1),
        busy_events=[busy_a, busy_b],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert slots == []


def test_free_slots_ignores_non_busy_events():
    day = datetime(2026, 9, 1, tzinfo=timezone.utc)
    non_busy = _event(
        datetime(2026, 9, 1, 14, 0, tzinfo=timezone.utc),
        datetime(2026, 9, 1, 16, 0, tzinfo=timezone.utc),
        is_busy=False,
    )
    slots = find_free_slots(
        range_start=day,
        range_end=day + timedelta(days=1),
        busy_events=[non_busy],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert len(slots) == 1
    assert slots[0].duration_minutes == 13 * 60


def test_free_slots_respects_multi_day_range():
    start = datetime(2026, 9, 1, 0, 0, tzinfo=timezone.utc)
    end = datetime(2026, 9, 3, 0, 0, tzinfo=timezone.utc)
    slots = find_free_slots(
        range_start=start,
        range_end=end,
        busy_events=[],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert len(slots) == 2
    for slot in slots:
        assert slot.duration_minutes == 13 * 60


def test_free_slots_empty_when_fully_booked():
    day = datetime(2026, 9, 1, tzinfo=timezone.utc)
    busy = _event(
        datetime(2026, 9, 1, 9, 0, tzinfo=timezone.utc),
        datetime(2026, 9, 1, 22, 0, tzinfo=timezone.utc),
    )
    slots = find_free_slots(
        range_start=day,
        range_end=day + timedelta(days=1),
        busy_events=[busy],
        preferred_study_start="09:00",
        preferred_study_end="22:00",
        min_session_minutes=25,
        user_timezone="UTC",
    )
    assert slots == []


def test_free_slots_endpoint_smoke(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    prefs = client.get("/users/me/preferences", headers=headers).json()

    base = datetime.now(timezone.utc) + timedelta(days=3)
    busy_start = base.replace(hour=14, minute=0, second=0, microsecond=0)
    busy_end = busy_start + timedelta(hours=2)

    client.post(
        "/calendar-events",
        json={
            "title": "Busy block",
            "event_type": "academic",
            "start_at": busy_start.isoformat(),
            "end_at": busy_end.isoformat(),
            "timezone": "UTC",
            "all_day": False,
            "priority": 3,
            "is_busy": True,
        },
        headers=headers,
    )

    range_start = base.replace(hour=0, minute=0, second=0, microsecond=0)
    range_end = range_start + timedelta(days=2)

    response = client.get(
        "/schedule/free-slots",
        params={"start": range_start.isoformat(), "end": range_end.isoformat()},
        headers=headers,
    )
    assert response.status_code == 200
    slots = response.json()
    assert len(slots) > 0

    for slot in slots:
        slot_start = datetime.fromisoformat(slot["start"])
        slot_end = datetime.fromisoformat(slot["end"])
        assert slot["duration_minutes"] >= prefs["min_session_minutes"]
        overlap = slot_start < busy_end and slot_end > busy_start
        assert not overlap


def test_free_slots_requires_timezone_aware_params(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.get(
        "/schedule/free-slots",
        params={"start": "2026-09-01T09:00:00", "end": "2026-09-01T22:00:00"},
        headers=headers,
    )
    assert response.status_code == 422


def test_free_slots_rejects_inverted_range(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start - timedelta(hours=1)

    response = client.get(
        "/schedule/free-slots",
        params={"start": start.isoformat(), "end": end.isoformat()},
        headers=headers,
    )
    assert response.status_code == 422

