from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_subject_task_exam_crud(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    subject_response = client.post(
        "/subjects",
        json={"name": "Database Management Systems", "code": "DBMS", "difficulty": 4},
        headers=headers,
    )
    assert subject_response.status_code == 201
    subject = subject_response.json()
    assert subject["code"] == "DBMS"

    task_response = client.post(
        "/tasks",
        json={
            "subject_id": subject["id"],
            "title": "Normalization assignment",
            "priority": 4,
            "difficulty": 4,
            "estimated_minutes": 120,
            "deadline_at": "2026-08-25T12:00:00Z",
        },
        headers=headers,
    )
    assert task_response.status_code == 201
    task = task_response.json()
    assert task["subject_id"] == subject["id"]

    task_update_response = client.patch(
        f"/tasks/{task['id']}",
        json={"status": "in_progress", "completed_minutes": 30},
        headers=headers,
    )
    assert task_update_response.status_code == 200
    assert task_update_response.json()["completed_minutes"] == 30

    exam_response = client.post(
        "/exams",
        json={
            "subject_id": subject["id"],
            "title": "DBMS Midterm",
            "exam_at": "2026-09-01T09:00:00Z",
            "duration_minutes": 120,
            "study_required_minutes": 480,
        },
        headers=headers,
    )
    assert exam_response.status_code == 201
    assert exam_response.json()["title"] == "DBMS Midterm"

    assert len(client.get("/subjects", headers=headers).json()) == 1
    assert len(client.get("/tasks", headers=headers).json()) == 1
    assert len(client.get("/exams", headers=headers).json()) == 1


def test_academic_resources_are_user_scoped(client: TestClient) -> None:
    register_user(client, "one@example.com")
    first_headers = auth_headers(client, "one@example.com")
    subject = client.post("/subjects", json={"name": "Private Subject"}, headers=first_headers).json()

    register_user(client, "two@example.com")
    second_headers = auth_headers(client, "two@example.com")

    response = client.get(f"/subjects/{subject['id']}", headers=second_headers)
    assert response.status_code == 404

    invalid_task = client.post(
        "/tasks",
        json={"subject_id": subject["id"], "title": "Should not attach"},
        headers=second_headers,
    )
    assert invalid_task.status_code == 400
