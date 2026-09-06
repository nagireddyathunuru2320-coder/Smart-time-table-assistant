from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class UserPreference(TimestampMixin, Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    preferred_study_start: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    preferred_study_end: Mapped[str] = mapped_column(String(5), default="21:00", nullable=False)
    max_session_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    min_session_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    break_minutes: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    allow_auto_reschedule: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_notifications: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="preferences")
