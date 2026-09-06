from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    timezone: str = Field(default="Asia/Kolkata", min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    timezone: str
    avatar_url: str | None
    is_active: bool
    study_goal_minutes_per_week: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PreferenceRead(BaseModel):
    id: int
    user_id: int
    preferred_study_start: str
    preferred_study_end: str
    max_session_minutes: int
    min_session_minutes: int
    break_minutes: int
    buffer_minutes: int
    allow_auto_reschedule: bool
    email_notifications: bool
    push_notifications: bool

    model_config = ConfigDict(from_attributes=True)


class PreferenceUpdate(BaseModel):
    preferred_study_start: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    preferred_study_end: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    max_session_minutes: int | None = Field(default=None, ge=15, le=360)
    min_session_minutes: int | None = Field(default=None, ge=5, le=240)
    break_minutes: int | None = Field(default=None, ge=0, le=120)
    buffer_minutes: int | None = Field(default=None, ge=0, le=120)
    allow_auto_reschedule: bool | None = None
    email_notifications: bool | None = None
    push_notifications: bool | None = None


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    avatar_url: str | None = None
    study_goal_minutes_per_week: int | None = Field(default=None, ge=0, le=10080)
