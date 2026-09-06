from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class CalendarAccount(TimestampMixin, Base):
    __tablename__ = "calendar_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    scopes: Mapped[str | None] = mapped_column(Text, nullable=True)
    access_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sync_status: Mapped[str] = mapped_column(String(50), default="not_synced", nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="calendar_accounts")
    events = relationship("CalendarEvent", back_populates="calendar_account")
    sync_logs = relationship("SyncLog", back_populates="calendar_account")


class CalendarEvent(TimestampMixin, Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    calendar_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("calendar_accounts.id", ondelete="SET NULL"),
        index=True,
    )
    external_event_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), default="academic", nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rrule: Mapped[str | None] = mapped_column(Text, nullable=True)
    recurrence_exception: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_event_id: Mapped[int | None] = mapped_column(ForeignKey("calendar_events.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    is_busy: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user = relationship("User")
    calendar_account = relationship("CalendarAccount", back_populates="events")
