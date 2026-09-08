from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_generate_study_plan_creates_blocks_and_is_idempotent(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(days=5)
    client.post(
        "/tasks",
        json={
            "title": "Finish essay",
            "task_type": "assignment",
            "priority": 4,
            "difficulty": 3,
            "estimated_minutes": 120,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    response = client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["created"], "expected at least one study block to be created"
    for block in data["created"]:
        assert block["entity_type"] == "task"

    events_after_first = client.get("/calendar-events", headers=headers).json()
    study_blocks_first = [e for e in events_after_first if e["event_type"] == "study_block"]
    assert len(study_blocks_first) == len(data["created"])

    response2 = client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)
    assert response2.status_code == 200

    events_after_second = client.get("/calendar-events", headers=headers).json()
    study_blocks_second = [e for e in events_after_second if e["event_type"] == "study_block"]
    assert len(study_blocks_second) == len(study_blocks_first)


def test_generate_study_plan_reports_unmet_need_when_impossible(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(hours=1)
    client.post(
        "/tasks",
        json={
            "title": "Impossible task",
            "task_type": "assignment",
            "priority": 5,
            "difficulty": 5,
            "estimated_minutes": 500,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    response = client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert any(u["entity_type"] == "task" for u in data["unmet"])


def test_generate_study_plan_is_user_scoped(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")

    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    deadline = datetime.now(timezone.utc) + timedelta(days=5)
    client.post(
        "/tasks",
        json={
            "title": "Owner's task",
            "task_type": "assignment",
            "priority": 4,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=owner_headers,
    )

    client.post("/schedule/generate-study-plan", params={"days": 14}, headers=owner_headers)

    other_events = client.get("/calendar-events", headers=other_headers).json()
    other_study_blocks = [e for e in other_events if e["event_type"] == "study_block"]
    assert other_study_blocks == []

