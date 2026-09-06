from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    id: int
    user_id: int
    channel: str
    notification_type: str
    title: str
    body: str
    scheduled_for: datetime
    sent_at: datetime | None
    status: str
    related_entity_type: str | None
    related_entity_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationUpdate(BaseModel):
    status: str | None = None
