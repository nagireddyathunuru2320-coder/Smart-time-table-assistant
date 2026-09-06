from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.dependencies import get_db
from app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(client: TestClient, email: str = "student@example.com") -> dict:
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "Student User",
            "password": "strong-password",
            "timezone": "Asia/Kolkata",
        },
    )
    assert response.status_code == 201
    return response.json()


def auth_headers(client: TestClient, email: str = "student@example.com") -> dict[str, str]:
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "strong-password"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
