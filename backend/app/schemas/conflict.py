from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConflictRead(BaseModel):
    id: int
    user_id: int
    conflict_type: str
    severity: str
    status: str
    title: str
    description: str
    affected_entity_type: str | None
    affected_entity_id: int | None
    secondary_entity_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConflictUpdate(BaseModel):
    status: str | None = None

