"""Google OAuth 2.0 helpers: authorize URL construction, code exchange,
token refresh, and signed-state generation/verification.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import httpx

from app.config import settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
CALENDAR_READONLY_SCOPE = (
    "https://www.googleapis.com/auth/calendar.readonly "
    "openid "
    "https://www.googleapis.com/auth/userinfo.email "
    "https://www.googleapis.com/auth/userinfo.profile"
)
STATE_MAX_AGE_SECONDS = 600


def _sign(payload: str) -> str:
    return hmac.new(
        settings.secret_key.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def sign_state(user_id: int) -> str:
    payload = json.dumps({"user_id": user_id, "ts": int(time.time())})
    payload_b64 = base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")
    return f"{payload_b64}.{_sign(payload_b64)}"


def verify_state(state: str) -> int | None:
    try:
        payload_b64, signature = state.split(".", 1)
    except ValueError:
        return None

    if not hmac.compare_digest(signature, _sign(payload_b64)):
        return None

    try:
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))
        timestamp = int(payload.get("ts", 0))
        user_id = int(payload["user_id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None

    if time.time() - timestamp > STATE_MAX_AGE_SECONDS or time.time() < timestamp:
        return None
    return user_id


def build_authorize_url(user_id: int) -> str:
    params = {
        "client_id": settings.google_oauth_client_id,
        "redirect_uri": settings.google_oauth_redirect_uri,
        "response_type": "code",
        "scope": CALENDAR_READONLY_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": sign_state(user_id),
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(code: str) -> dict:
    response = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_oauth_client_id,
            "client_secret": settings.google_oauth_client_secret,
            "redirect_uri": settings.google_oauth_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15.0,
    )
    response.raise_for_status()
    return response.json()


def refresh_access_token(refresh_token: str) -> dict:
    response = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "refresh_token": refresh_token,
            "client_id": settings.google_oauth_client_id,
            "client_secret": settings.google_oauth_client_secret,
            "grant_type": "refresh_token",
        },
        timeout=15.0,
    )
    response.raise_for_status()
    return response.json()


def fetch_userinfo(access_token: str) -> dict:
    response = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15.0,
    )
    response.raise_for_status()
    return response.json()
