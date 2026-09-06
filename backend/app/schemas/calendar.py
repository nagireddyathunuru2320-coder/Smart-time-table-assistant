from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CalendarEventFields(BaseModel):
    """Shared fields only — no validation. Read, Create, and Update all use this."""

    calendar_account_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    event_type: str = Field(default="academic", max_length=50)
    start_at: datetime
    end_at: datetime
    timezone: str = Field(default="UTC", max_length=100)
    all_day: bool = False
    rrule: str | None = None
    recurrence_exception: str | None = None
    parent_event_id: int | None = None
    priority: int = Field(default=3, ge=1, le=5)
    is_busy: bool = True


class CalendarEventCreate(CalendarEventFields):
    @model_validator(mode="after")
    def _validate_times(self) -> "CalendarEventCreate":
        if self.start_at.tzinfo is None or self.end_at.tzinfo is None:
            raise ValueError("start_at and end_at must be timezone-aware")
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class CalendarEventUpdate(BaseModel):
    calendar_account_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    event_type: str | None = Field(default=None, max_length=50)
    start_at: datetime | None = None
    end_at: datetime | None = None
    timezone: str | None = Field(default=None, max_length=100)
    all_day: bool | None = None
    rrule: str | None = None
    recurrence_exception: str | None = None
    parent_event_id: int | None = None
    priority: int | None = Field(default=None, ge=1, le=5)
    is_busy: bool | None = None

    @model_validator(mode="after")
    def _validate_times(self) -> "CalendarEventUpdate":
        if self.start_at is not None and self.start_at.tzinfo is None:
            raise ValueError("start_at must be timezone-aware")
        if self.end_at is not None and self.end_at.tzinfo is None:
            raise ValueError("end_at must be timezone-aware")
        if self.start_at is not None and self.end_at is not None and self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class CalendarEventRead(CalendarEventFields):
    id: int
    user_id: int
    source: str
    external_event_id: str | None = None

    model_config = ConfigDict(from_attributes=True)