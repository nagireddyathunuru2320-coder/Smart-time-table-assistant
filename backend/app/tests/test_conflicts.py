from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def _event_payload(start: datetime, end: datetime, **overrides) -> dict:
    payload = {
        "title": "Event",
        "event_type": "academic",
        "start_at": start.isoformat(),
        "end_at": end.isoformat(),
        "timezone": "UTC",
        "all_day": False,
        "priority": 3,
        "is_busy": True,
    }
    payload.update(overrides)
    return payload


def test_no_conflicts_when_events_dont_overlap(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=1), title="A"),
        headers=headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(base + timedelta(hours=2), base + timedelta(hours=3), title="B"),
        headers=headers,
    )

    response = client.get("/conflicts", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_detects_overlap_between_two_events(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="Study block"),
        headers=headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(
            base + timedelta(hours=1), base + timedelta(hours=3), title="Club meeting"
        ),
        headers=headers,
    )

    response = client.get("/conflicts", headers=headers)
    assert response.status_code == 200
    conflicts = response.json()
    assert len(conflicts) == 1
    assert conflicts[0]["conflict_type"] == "calendar_overlap"
    assert conflicts[0]["status"] == "open"
    assert conflicts[0]["severity"] == "high"  # 60 min overlap


def test_ignores_non_busy_events(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="Busy block", is_busy=True),
        headers=headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(
            base + timedelta(hours=1), base + timedelta(hours=3), title="Free reminder", is_busy=False
        ),
        headers=headers,
    )

    response = client.get("/conflicts", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_conflict_auto_resolves_when_event_moved(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    event_a = client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="A"),
        headers=headers,
    ).json()
    client.post(
        "/calendar-events",
        json=_event_payload(
            base + timedelta(hours=1), base + timedelta(hours=3), title="B"
        ),
        headers=headers,
    )

    first = client.get("/conflicts", headers=headers).json()
    assert len(first) == 1

    # Move event A so it no longer overlaps with B
    client.patch(
        f"/calendar-events/{event_a['id']}",
        json={
            "start_at": (base - timedelta(hours=5)).isoformat(),
            "end_at": (base - timedelta(hours=3)).isoformat(),
        },
        headers=headers,
    )

    second = client.get("/conflicts?status=open", headers=headers).json()
    assert second == []


def test_conflicts_are_user_scoped(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")

    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="A"),
        headers=owner_headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(base + timedelta(hours=1), base + timedelta(hours=3), title="B"),
        headers=owner_headers,
    )

    owner_conflicts = client.get("/conflicts", headers=owner_headers).json()
    other_conflicts = client.get("/conflicts", headers=other_headers).json()

    assert len(owner_conflicts) == 1
    assert other_conflicts == []


def test_update_conflict_status(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="A"),
        headers=headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(base + timedelta(hours=1), base + timedelta(hours=3), title="B"),
        headers=headers,
    )

    conflict = client.get("/conflicts", headers=headers).json()[0]

    response = client.patch(
        f"/conflicts/{conflict['id']}",
        json={"status": "dismissed"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "dismissed"


def test_sync_does_not_duplicate_dismissed_conflicts(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    base = datetime.now(timezone.utc) + timedelta(days=1)
    client.post(
        "/calendar-events",
        json=_event_payload(base, base + timedelta(hours=2), title="A"),
        headers=headers,
    )
    client.post(
        "/calendar-events",
        json=_event_payload(base + timedelta(hours=1), base + timedelta(hours=3), title="B"),
        headers=headers,
    )

    first = client.get("/conflicts", headers=headers).json()
    assert len(first) == 1
    conflict_id = first[0]["id"]

    dismiss_response = client.patch(
        f"/conflicts/{conflict_id}", json={"status": "dismissed"}, headers=headers
    )
    assert dismiss_response.status_code == 200

    # Calling GET /conflicts repeatedly must not create duplicate rows for
    # the same still-overlapping, still-dismissed pair.
    for _ in range(3):
        client.get("/conflicts", headers=headers)

    all_conflicts = client.get("/conflicts?status=dismissed", headers=headers).json()
    assert len(all_conflicts) == 1
    assert all_conflicts[0]["id"] == conflict_id

    open_conflicts = client.get("/conflicts?status=open", headers=headers).json()
    assert open_conflicts == []


