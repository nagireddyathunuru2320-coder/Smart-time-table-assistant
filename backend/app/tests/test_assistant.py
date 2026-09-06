from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_create_task_via_chat_requires_confirmation(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post(
        "/assistant/messages",
        json={"content": "add a task to finish my essay by friday, high priority"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    conversation_id = data["conversation_id"]
    assert data["assistant_message"]["validation_status"] == "awaiting_confirmation"

    tasks_before = client.get("/tasks", headers=headers).json()
    assert not any("essay" in t["title"].lower() for t in tasks_before)

    client.post(
        "/assistant/messages",
        json={"content": "yes", "conversation_id": conversation_id},
        headers=headers,
    )

    tasks_after = client.get("/tasks", headers=headers).json()
    matching = [t for t in tasks_after if "essay" in t["title"].lower()]
    assert len(matching) == 1
    assert matching[0]["priority"] == 5


def test_create_event_via_chat(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post(
        "/assistant/messages",
        json={"content": "schedule a meeting from 2pm to 4pm tomorrow"},
        headers=headers,
    )
    conversation_id = response.json()["conversation_id"]

    client.post(
        "/assistant/messages",
        json={"content": "confirm", "conversation_id": conversation_id},
        headers=headers,
    )

    events = client.get("/calendar-events", headers=headers).json()
    matching = [e for e in events if "meeting" in e["title"].lower()]
    assert len(matching) == 1


def test_cancel_does_not_create_anything(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post(
        "/assistant/messages",
        json={"content": "add a task to read chapter 5 by tomorrow"},
        headers=headers,
    )
    conversation_id = response.json()["conversation_id"]

    client.post(
        "/assistant/messages",
        json={"content": "cancel", "conversation_id": conversation_id},
        headers=headers,
    )

    tasks = client.get("/tasks", headers=headers).json()
    assert not any("chapter 5" in t["title"].lower() for t in tasks)


def test_free_time_query_does_not_require_confirmation(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post(
        "/assistant/messages",
        json={"content": "when am I free this week"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["assistant_message"]["validation_status"] != "awaiting_confirmation"


def test_unknown_message_gives_helpful_fallback(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post(
        "/assistant/messages",
        json={"content": "asdkjaslkdjaslkdjas"},
        headers=headers,
    )
    assert response.status_code == 200
    reply = response.json()["assistant_message"]["content"].lower()
    assert "try" in reply or "understand" in reply


def test_conversations_are_user_scoped(client: TestClient) -> None:
    register_user(client, email="student@example.com")
    owner_headers = auth_headers(client, email="student@example.com")
    register_user(client, email="other@example.com")
    other_headers = auth_headers(client, email="other@example.com")

    response = client.post(
        "/assistant/messages",
        json={"content": "when am I free this week"},
        headers=owner_headers,
    )
    conversation_id = response.json()["conversation_id"]

    other_response = client.get(
        f"/assistant/conversations/{conversation_id}/messages", headers=other_headers
    )
    assert other_response.status_code == 404
