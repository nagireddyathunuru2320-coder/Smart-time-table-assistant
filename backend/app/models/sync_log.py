from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class SyncLog(TimestampMixin, Base):
    __tablename__ = "sync_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    calendar_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("calendar_accounts.id", ondelete="SET NULL"),
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    events_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    events_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    events_deleted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    calendar_account = relationship("CalendarAccount", back_populates="sync_logs")
