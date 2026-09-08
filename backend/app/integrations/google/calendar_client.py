"""Thin wrapper around Google Calendar's read-only events.list REST API."""
from __future__ import annotations

from datetime import datetime

import httpx

CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


def list_events(access_token: str, time_min: datetime, time_max: datetime) -> list[dict]:
    response = httpx.get(
        CALENDAR_EVENTS_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "timeMin": time_min.isoformat(),
            "timeMax": time_max.isoformat(),
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": 250,
        },
        timeout=20.0,
    )
    response.raise_for_status()
    return response.json().get("items", [])
