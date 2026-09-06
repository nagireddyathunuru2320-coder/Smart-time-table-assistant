import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status


HASH_NAME = "sha256"
ITERATIONS = 210_000
SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(SALT_BYTES)
    derived = hashlib.pbkdf2_hmac(HASH_NAME, password.encode("utf-8"), salt, ITERATIONS)
    return f"pbkdf2_{HASH_NAME}${ITERATIONS}${_b64encode(salt)}${_b64encode(derived)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = password_hash.split("$", 3)
        if algorithm != f"pbkdf2_{HASH_NAME}":
            return False
        derived = hashlib.pbkdf2_hmac(
            HASH_NAME,
            password.encode("utf-8"),
            _b64decode(salt),
            int(iterations),
        )
        return hmac.compare_digest(_b64encode(derived), expected)
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, secret_key: str, expires_minutes: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": subject,
        "exp": int(expires_at.timestamp()),
        "typ": "access",
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(body, secret_key)
    return f"{body}.{signature}"


def decode_access_token(token: str, secret_key: str) -> dict[str, str | int]:
    try:
        body, signature = token.split(".", 1)
    except ValueError as exc:
        raise _credentials_error() from exc

    if not hmac.compare_digest(_sign(body, secret_key), signature):
        raise _credentials_error()

    try:
        payload = json.loads(_b64decode(body))
    except (json.JSONDecodeError, ValueError) as exc:
        raise _credentials_error() from exc

    if payload.get("typ") != "access" or "sub" not in payload or "exp" not in payload:
        raise _credentials_error()

    if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def _sign(body: str, secret_key: str) -> str:
    digest = hmac.new(secret_key.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).digest()
    return _b64encode(digest)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
