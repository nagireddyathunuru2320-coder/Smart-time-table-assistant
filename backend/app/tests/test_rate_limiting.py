from fastapi.testclient import TestClient


def test_login_rate_limit_blocks_after_threshold(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={
            "email": "ratelimit@example.com",
            "full_name": "Rate Limit Test",
            "password": "strong-password",
            "timezone": "Asia/Kolkata",
        },
    )

    responses = []
    for _ in range(12):
        response = client.post(
            "/auth/login",
            json={"email": "ratelimit@example.com", "password": "wrong-password"},
        )
        responses.append(response.status_code)

    assert 429 in responses, (
        "expected at least one 429 Too Many Requests after exceeding the login rate limit, "
        f"got status codes: {responses}"
    )
