from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def _event_payload(**overrides) -> dict:
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=1)
    payload = {
        "title": "CS101 Lecture",
        "description": "Intro to algorithms",
        "location": "Room 204",
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


def test_create_calendar_event(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post("/calendar-events", json=_event_payload(), headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "CS101 Lecture"
    assert data["source"] == "local"
    assert "id" in data


def test_create_calendar_event_rejects_inverted_range(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start - timedelta(hours=1)
    response = client.post(
        "/calendar-events",
        json=_event_payload(start_at=start.isoformat(), end_at=end.isoformat()),
        headers=headers,
    )
    assert response.status_code == 422


def test_create_calendar_event_rejects_naive_datetime(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    payload = _event_payload()
    payload["start_at"] = "2026-01-01T09:00:00"  # no tz offset
    response = client.post("/calendar-events", json=payload, headers=headers)
    assert response.status_code == 422


def test_list_calendar_events(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    client.post("/calendar-events", json=_event_payload(title="Event A"), headers=headers)
    client.post("/calendar-events", json=_event_payload(title="Event B"), headers=headers)

    response = client.get("/calendar-events", headers=headers)
    assert response.status_code == 200
    titles = {item["title"] for item in response.json()}
    assert {"Event A", "Event B"}.issubset(titles)


def test_get_calendar_event(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    created = client.post("/calendar-events", json=_event_payload(), headers=headers).json()
    response = client.get(f"/calendar-events/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_update_calendar_event(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    created = client.post("/calendar-events", json=_event_payload(), headers=headers).json()
    response = client.patch(
        f"/calendar-events/{created['id']}",
        json={"title": "Updated title", "location": "Room 305"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated title"
    assert data["location"] == "Room 305"


def test_update_calendar_event_rejects_inverted_range(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    created = client.post("/calendar-events", json=_event_payload(), headers=headers).json()
    bad_end = datetime.fromisoformat(created["start_at"]) - timedelta(hours=1)

    response = client.patch(
        f"/calendar-events/{created['id']}",
        json={"end_at": bad_end.isoformat()},
        headers=headers,
    )
    assert response.status_code == 422


def test_delete_calendar_event(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    created = client.post("/calendar-events", json=_event_payload(), headers=headers).json()
    response = client.delete(f"/calendar-events/{created['id']}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/calendar-events/{created['id']}", headers=headers)
    assert response.status_code == 404


def test_calendar_event_user_scoping(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")

    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    created = client.post("/calendar-events", json=_event_payload(), headers=owner_headers).json()
    event_id = created["id"]

    response = client.get(f"/calendar-events/{event_id}", headers=other_headers)
    assert response.status_code == 404

    response = client.patch(
        f"/calendar-events/{event_id}",
        json={"title": "Hijacked"},
        headers=other_headers,
    )
    assert response.status_code == 404

    response = client.delete(f"/calendar-events/{event_id}", headers=other_headers)
    assert response.status_code == 404

    response = client.get("/calendar-events", headers=other_headers)
    assert response.status_code == 200
    ids = {item["id"] for item in response.json()}
    assert event_id not in ids


def test_calendar_event_rejects_other_users_calendar_account(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    auth_headers(client, email="student@example.com")

    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    # other user has no calendar_accounts row yet -> id 1 either doesn't
    # exist or (if it did) wouldn't belong to them; either way this must 400.
    response = client.post(
        "/calendar-events",
        json=_event_payload(calendar_account_id=99999),
        headers=other_headers,
    )
    assert response.status_code == 400