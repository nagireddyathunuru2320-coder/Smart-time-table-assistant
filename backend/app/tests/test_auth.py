from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def register(client: TestClient, email: str = "student@example.com") -> dict:
    return register_user(client, email)


def login(client: TestClient, email: str = "student@example.com") -> str:
    headers = auth_headers(client, email)
    return headers["Authorization"].removeprefix("Bearer ")


def test_register_login_and_read_current_user(client: TestClient) -> None:
    user = register(client)
    assert user["email"] == "student@example.com"
    assert "password_hash" not in user

    token = login(client)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "student@example.com"


def test_register_rejects_duplicate_email(client: TestClient) -> None:
    register(client)

    response = client.post(
        "/auth/register",
        json={
            "email": "student@example.com",
            "full_name": "Student User",
            "password": "strong-password",
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 409


def test_login_rejects_bad_password(client: TestClient) -> None:
    register(client)

    response = client.post(
        "/auth/login",
        json={"email": "student@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_update_profile_and_preferences(client: TestClient) -> None:
    register(client)
    token = login(client)
    headers = {"Authorization": f"Bearer {token}"}

    profile_response = client.patch(
        "/users/me",
        json={"timezone": "UTC", "study_goal_minutes_per_week": 600},
        headers=headers,
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["timezone"] == "UTC"
    assert profile_response.json()["study_goal_minutes_per_week"] == 600

    preferences_response = client.patch(
        "/users/me/preferences",
        json={"max_session_minutes": 90, "allow_auto_reschedule": True},
        headers=headers,
    )
    assert preferences_response.status_code == 200
    assert preferences_response.json()["max_session_minutes"] == 90
    assert preferences_response.json()["allow_auto_reschedule"] is True
