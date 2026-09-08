"""Orchestrates Google Calendar OAuth connection and one-way sync into
calendar_events. Read-only: this app never writes back to Google.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.google import oauth as google_oauth
from app.integrations.google.calendar_client import list_events
from app.integrations.google.token_crypto import decrypt_token, encrypt_token
from app.models import CalendarAccount, CalendarEvent, SyncLog, User

SYNC_WINDOW_PAST = timedelta(days=7)
SYNC_WINDOW_FUTURE = timedelta(days=60)


def get_authorize_url(user: User) -> str:
    return google_oauth.build_authorize_url(user.id)


def handle_oauth_callback(db: Session, code: str, state: str) -> CalendarAccount:
    user_id = google_oauth.verify_state(state)
    if user_id is None:
        raise ValueError("Invalid or expired OAuth state")

    tokens = google_oauth.exchange_code_for_tokens(code)
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    userinfo = google_oauth.fetch_userinfo(access_token)

    existing = db.scalar(
        select(CalendarAccount).where(
            CalendarAccount.user_id == user_id,
            CalendarAccount.provider == "google",
            CalendarAccount.provider_account_id == userinfo.get("id"),
        )
    )
    token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    if existing is not None:
        existing.access_token_encrypted = encrypt_token(access_token)
        if refresh_token:
            existing.refresh_token_encrypted = encrypt_token(refresh_token)
        existing.token_expires_at = token_expires_at
        existing.sync_status = "not_synced"
        account = existing
    else:
        if not refresh_token:
            raise ValueError(
                "Google did not return a refresh token. Revoke this app's access at "
                "https://myaccount.google.com/permissions and try connecting again."
            )
        account = CalendarAccount(
            user_id=user_id,
            provider="google",
            provider_account_id=userinfo.get("id"),
            display_name=userinfo.get("name", "Google Calendar"),
            email=userinfo.get("email"),
            scopes=google_oauth.CALENDAR_READONLY_SCOPE,
            access_token_encrypted=encrypt_token(access_token),
            refresh_token_encrypted=encrypt_token(refresh_token),
            token_expires_at=token_expires_at,
            sync_enabled=True,
            sync_status="not_synced",
        )
        db.add(account)

    db.commit()
    db.refresh(account)
    return account


def _get_valid_access_token(db: Session, account: CalendarAccount) -> str:
    now = datetime.now(timezone.utc)
    if account.token_expires_at and account.token_expires_at > now + timedelta(minutes=2):
        return decrypt_token(account.access_token_encrypted)

    refresh_token = decrypt_token(account.refresh_token_encrypted)
    tokens = google_oauth.refresh_access_token(refresh_token)
    access_token = tokens["access_token"]
    expires_in = tokens.get("expires_in", 3600)
    account.access_token_encrypted = encrypt_token(access_token)
    account.token_expires_at = now + timedelta(seconds=expires_in)
    db.commit()
    return access_token


def _parse_google_datetime(value: dict) -> tuple[datetime, bool]:
    if "dateTime" in value:
        return datetime.fromisoformat(value["dateTime"].replace("Z", "+00:00")), False
    return datetime.fromisoformat(value["date"]).replace(tzinfo=timezone.utc), True


def sync_account(db: Session, account: CalendarAccount) -> SyncLog:
    started_at = datetime.now(timezone.utc)
    log = SyncLog(
        user_id=account.user_id,
        calendar_account_id=account.id,
        provider="google",
        started_at=started_at,
        status="running",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    try:
        access_token = _get_valid_access_token(db, account)
        time_min = started_at - SYNC_WINDOW_PAST
        time_max = started_at + SYNC_WINDOW_FUTURE
        google_events = list_events(access_token, time_min, time_max)
        seen_external_ids: set[str] = set()
        created = updated = 0

        for google_event in google_events:
            external_id = google_event.get("id")
            if not external_id or google_event.get("status") == "cancelled":
                continue
            if "start" not in google_event or "end" not in google_event:
                continue

            start_at, all_day = _parse_google_datetime(google_event["start"])
            end_at, _ = _parse_google_datetime(google_event["end"])
            seen_external_ids.add(external_id)
            existing_event = db.scalar(
                select(CalendarEvent).where(
                    CalendarEvent.calendar_account_id == account.id,
                    CalendarEvent.external_event_id == external_id,
                )
            )
            values = {
                "title": google_event.get("summary", "(No title)"),
                "description": google_event.get("description"),
                "location": google_event.get("location"),
                "start_at": start_at,
                "end_at": end_at,
                "all_day": all_day,
            }
            if existing_event is not None:
                for field, value in values.items():
                    setattr(existing_event, field, value)
                updated += 1
            else:
                db.add(
                    CalendarEvent(
                        user_id=account.user_id,
                        calendar_account_id=account.id,
                        external_event_id=external_id,
                        event_type="academic",
                        timezone="UTC",
                        source="google",
                        priority=3,
                        is_busy=True,
                        **values,
                    )
                )
                created += 1

        stale_events = list(
            db.scalars(
                select(CalendarEvent).where(
                    CalendarEvent.calendar_account_id == account.id,
                    CalendarEvent.start_at >= time_min,
                    CalendarEvent.start_at <= time_max,
                )
            ).all()
        )
        deleted = 0
        for stale in stale_events:
            if stale.external_event_id and stale.external_event_id not in seen_external_ids:
                db.delete(stale)
                deleted += 1

        account.sync_status = "synced"
        account.last_synced_at = started_at
        log.status = "success"
        log.finished_at = datetime.now(timezone.utc)
        log.events_created = created
        log.events_updated = updated
        log.events_deleted = deleted
        db.commit()
        db.refresh(log)
        return log
    except Exception as exc:
        db.rollback()
        log.status = "failed"
        log.finished_at = datetime.now(timezone.utc)
        log.error_message = str(exc)[:2000]
        account.sync_status = "error"
        db.add(log)
        db.commit()
        db.refresh(log)
        return log


def list_accounts(db: Session, user: User) -> list[CalendarAccount]:
    return list(db.scalars(select(CalendarAccount).where(CalendarAccount.user_id == user.id)).all())


def disconnect_account(db: Session, user: User, account_id: int) -> None:
    account = db.get(CalendarAccount, account_id)
    if account is None or account.user_id != user.id:
        raise ValueError("Calendar account not found")
    db.delete(account)
    db.commit()
