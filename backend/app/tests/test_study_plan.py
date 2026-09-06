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


def test_regeneration_does_not_self_block_on_previous_run(client: TestClient) -> None:
    """Regression test for the bug where a study plan's own previously
    generated blocks were counted as busy time on the next regeneration,
    causing needs that succeeded on run 1 to become fully unmet on run 2.
    """
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(days=5)
    client.post(
        "/tasks",
        json={
            "title": "Read chapter 4",
            "task_type": "reading",
            "priority": 3,
            "difficulty": 2,
            "estimated_minutes": 90,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    first = client.post(
        "/schedule/generate-study-plan", params={"days": 14}, headers=headers
    ).json()
    assert first["created"], "expected the task to be scheduled on the first run"
    assert not any(u["entity_type"] == "task" for u in first["unmet"])

    second = client.post(
        "/schedule/generate-study-plan", params={"days": 14}, headers=headers
    ).json()
    assert second["created"], "task should still be fully schedulable on regeneration"
    assert not any(u["entity_type"] == "task" for u in second["unmet"]), (
        "regenerating should not make a previously-met need become unmet "
        "just because its own old study blocks are still on the calendar"
    )


def test_regenerating_twice_never_leaves_overlapping_study_blocks(client: TestClient) -> None:
    """Regression test: bug caused a block created moments ago in the first
    run to be skipped by the cleanup on the second run (since its start_at
    was already in the past relative to the second run's "now"), letting a
    fresh block get scheduled directly on top of it.
    """
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(days=5)
    client.post(
        "/tasks",
        json={
            "title": "Long task",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 300,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)
    client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)

    events = client.get("/calendar-events", headers=headers).json()
    study_blocks = sorted(
        (e for e in events if e["event_type"] == "study_block"),
        key=lambda e: e["start_at"],
    )

    for i in range(len(study_blocks) - 1):
        current_end = datetime.fromisoformat(study_blocks[i]["end_at"])
        next_start = datetime.fromisoformat(study_blocks[i + 1]["start_at"])
        assert next_start >= current_end, (
            f"study blocks overlap after regenerating twice: "
            f"{study_blocks[i]} and {study_blocks[i + 1]}"
        )

    conflicts = client.get("/conflicts?status=open", headers=headers).json()
    assert conflicts == [], "regenerating twice should never produce open conflicts"


def test_study_blocks_never_overlap_an_exam(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    exam_time = datetime.now(timezone.utc) + timedelta(days=1)
    exam_time = exam_time.replace(hour=10, minute=0, second=0, microsecond=0)
    exam_response = client.post(
        "/exams",
        json={
            "title": "Midterm",
            "exam_at": exam_time.isoformat(),
            "duration_minutes": 120,
            "difficulty": 3,
            "priority": 5,
            "study_required_minutes": 300,
        },
        headers=headers,
    )
    assert exam_response.status_code == 201
    exam_end = exam_time + timedelta(minutes=120)

    client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)

    events = client.get("/calendar-events", headers=headers).json()
    study_blocks = [e for e in events if e["event_type"] == "study_block"]

    for block in study_blocks:
        block_start = datetime.fromisoformat(block["start_at"])
        block_end = datetime.fromisoformat(block["end_at"])
        if block_start.tzinfo is None:
            block_start = block_start.replace(tzinfo=timezone.utc)
        if block_end.tzinfo is None:
            block_end = block_end.replace(tzinfo=timezone.utc)
        overlaps_exam = block_start < exam_end and block_end > exam_time
        assert not overlaps_exam, (
            f"study block {block['title']} ({block_start} - {block_end}) "
            f"overlaps the exam window ({exam_time} - {exam_end})"
        )

