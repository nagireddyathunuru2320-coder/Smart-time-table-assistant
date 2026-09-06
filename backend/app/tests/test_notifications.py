from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_generates_reminder_for_task_due_soon(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(hours=24)
    client.post(
        "/tasks",
        json={
            "title": "Finish essay",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    response = client.get("/notifications", headers=headers)
    assert response.status_code == 200
    notifications = response.json()
    assert any(n["notification_type"] == "task_deadline" for n in notifications)
    assert all(n["status"] == "unread" for n in notifications)


def test_no_reminder_for_task_far_in_the_future(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(days=10)
    client.post(
        "/tasks",
        json={
            "title": "Distant task",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    response = client.get("/notifications", headers=headers)
    assert response.json() == []


def test_no_reminder_for_completed_task(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(hours=12)
    client.post(
        "/tasks",
        json={
            "title": "Done already",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "completed",
        },
        headers=headers,
    )

    response = client.get("/notifications", headers=headers)
    assert response.json() == []


def test_generates_reminder_for_upcoming_exam(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    exam_time = datetime.now(timezone.utc) + timedelta(days=2)
    client.post(
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

    notifications = client.get("/notifications", headers=headers).json()
    assert any(n["notification_type"] == "exam_reminder" for n in notifications)


def test_dismissing_does_not_recreate_notification(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(hours=12)
    client.post(
        "/tasks",
        json={
            "title": "Recurring test",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    first = client.get("/notifications", headers=headers).json()
    assert len(first) == 1
    notif_id = first[0]["id"]

    client.patch(f"/notifications/{notif_id}", json={"status": "read"}, headers=headers)

    for _ in range(3):
        client.get("/notifications", headers=headers)

    all_notifs = client.get("/notifications", headers=headers).json()
    assert len(all_notifs) == 1
    assert all_notifs[0]["id"] == notif_id
    assert all_notifs[0]["status"] == "read"


def test_mark_all_read(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(hours=12)
    client.post(
        "/tasks",
        json={
            "title": "Task A",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )

    client.get("/notifications", headers=headers)
    response = client.post("/notifications/mark-all-read", headers=headers)
    assert response.status_code == 200
    assert all(n["status"] == "read" for n in response.json())


def test_notifications_are_user_scoped(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")
    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    deadline = datetime.now(timezone.utc) + timedelta(hours=12)
    client.post(
        "/tasks",
        json={
            "title": "Owner task",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=owner_headers,
    )

    owner_notifs = client.get("/notifications", headers=owner_headers).json()
    other_notifs = client.get("/notifications", headers=other_headers).json()

    assert len(owner_notifs) == 1
    assert other_notifs == []
