from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CalendarAccountRead(BaseModel):
    id: int
    user_id: int
    provider: str
    provider_account_id: str | None
    display_name: str
    email: str | None
    sync_enabled: bool
    sync_status: str
    last_synced_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SyncLogRead(BaseModel):
    id: int
    calendar_account_id: int | None
    provider: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    events_created: int
    events_updated: int
    events_deleted: int
    error_message: str | None

    model_config = ConfigDict(from_attributes=True)


class AuthorizeUrlResponse(BaseModel):
    url: str
