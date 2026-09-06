from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class Exam(TimestampMixin, Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    exam_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    study_required_minutes: Mapped[int] = mapped_column(Integer, default=360, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
