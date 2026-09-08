from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def _create_soon_task(client: TestClient, headers: dict, title: str) -> None:
    deadline = datetime.now(timezone.utc) + timedelta(hours=12)
    client.post(
        "/tasks",
        json={
            "title": title,
            "task_type": "assignment",
            "priority": 3,
            "difficulty": 3,
            "estimated_minutes": 60,
            "deadline_at": deadline.isoformat(),
            "status": "pending",
        },
        headers=headers,
    )


def test_email_notification_sent_when_enabled(client: TestClient, monkeypatch) -> None:
    register_user(client)
    headers = auth_headers(client)
    client.patch("/users/me/preferences", json={"email_notifications": True}, headers=headers)

    import app.services.notification_service as ns

    sent = []
    monkeypatch.setattr(ns, "send_email", lambda to_email, subject, body: sent.append(to_email))
    _create_soon_task(client, headers, "Email test task")

    notifications = client.get("/notifications", headers=headers).json()
    email_notifs = [n for n in notifications if n["channel"] == "email"]
    assert len(email_notifs) == 1
    assert email_notifs[0]["status"] == "sent"
    assert len(sent) == 1


def test_email_notification_marked_failed_on_smtp_error(client: TestClient, monkeypatch) -> None:
    register_user(client)
    headers = auth_headers(client)
    client.patch("/users/me/preferences", json={"email_notifications": True}, headers=headers)

    import app.services.notification_service as ns

    monkeypatch.setattr(ns, "send_email", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("smtp down")))
    _create_soon_task(client, headers, "Email fail task")

    notifications = client.get("/notifications", headers=headers).json()
    email_notifs = [n for n in notifications if n["channel"] == "email"]
    assert len(email_notifs) == 1
    assert email_notifs[0]["status"] == "failed"


def test_no_email_notification_when_disabled(client: TestClient, monkeypatch) -> None:
    register_user(client)
    headers = auth_headers(client)
    client.patch("/users/me/preferences", json={"email_notifications": False}, headers=headers)

    import app.services.notification_service as ns

    called = []
    monkeypatch.setattr(ns, "send_email", lambda *args, **kwargs: called.append(1))
    _create_soon_task(client, headers, "No email task")

    notifications = client.get("/notifications", headers=headers).json()
    assert all(n["channel"] != "email" for n in notifications)
    assert called == []


def test_email_and_in_app_dedup_independently(client: TestClient, monkeypatch) -> None:
    register_user(client)
    headers = auth_headers(client)
    client.patch("/users/me/preferences", json={"email_notifications": True}, headers=headers)

    import app.services.notification_service as ns

    sent = []
    monkeypatch.setattr(ns, "send_email", lambda to_email, subject, body: sent.append(1))
    _create_soon_task(client, headers, "Dedup test task")

    for _ in range(3):
        client.get("/notifications", headers=headers)

    notifications = client.get("/notifications", headers=headers).json()
    assert len([n for n in notifications if n["channel"] == "email"]) == 1
    assert len([n for n in notifications if n["channel"] == "in_app"]) == 1
    assert len(sent) == 1
