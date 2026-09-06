from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_analytics_summary_endpoint_smoke(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    deadline = datetime.now(timezone.utc) + timedelta(days=3)
    client.post(
        "/tasks",
        json={
            "title": "Sample task",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 90,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )
    client.post("/schedule/generate-study-plan", params={"days": 14}, headers=headers)

    response = client.get("/analytics/summary", params={"days": 14}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "weekly_study_minutes" in data
    assert "task_completion_rate" in data
    assert len(data["daily_trend"]) == 14
    assert isinstance(data["upcoming_exams"], list)


def test_analytics_summary_is_user_scoped(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")
    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    deadline = datetime.now(timezone.utc) + timedelta(days=3)
    client.post(
        "/tasks",
        json={
            "title": "Owner task",
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "completed",
        },
        headers=owner_headers,
    )

    owner_summary = client.get("/analytics/summary", headers=owner_headers).json()
    other_summary = client.get("/analytics/summary", headers=other_headers).json()

    assert owner_summary["tasks_completed"] == 1
    assert other_summary["tasks_completed"] == 0
