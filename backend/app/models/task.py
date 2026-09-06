from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(String(50), default="assignment", nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    completed_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
    study_sessions = relationship("StudySession", back_populates="task")
