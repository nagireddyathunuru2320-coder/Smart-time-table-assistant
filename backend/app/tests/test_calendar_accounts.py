from fastapi.testclient import TestClient

from app.tests.conftest import auth_headers, register_user


def test_list_accounts_empty_for_new_user(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.get("/calendar-accounts", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_authorize_url_contains_expected_params(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.get("/calendar-accounts/google/authorize-url", headers=headers)
    assert response.status_code == 200
    url = response.json()["url"]
    assert "accounts.google.com" in url
    assert "state=" in url
    assert "scope=" in url


def test_disconnect_nonexistent_account_returns_404(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.delete("/calendar-accounts/99999", headers=headers)
    assert response.status_code == 404


def test_sync_nonexistent_account_returns_404(client: TestClient) -> None:
    register_user(client)
    headers = auth_headers(client)

    response = client.post("/calendar-accounts/99999/sync", headers=headers)
    assert response.status_code == 404
