from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class StudySession(TimestampMixin, Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    planned_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="planned", nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="scheduler", nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="study_sessions")
    subject = relationship("Subject", back_populates="study_sessions")
    task = relationship("Task", back_populates="study_sessions")
