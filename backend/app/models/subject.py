from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class Subject(TimestampMixin, Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#2563eb", nullable=False)
    instructor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    weekly_target_minutes: Mapped[int] = mapped_column(Integer, default=180, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="subjects")
    tasks = relationship("Task", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")
    study_sessions = relationship("StudySession", back_populates="subject")
