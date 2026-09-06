from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin


class ProductivityRecord(TimestampMixin, Base):
    __tablename__ = "productivity_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True)
    record_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    planned_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actual_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_tasks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    missed_tasks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    productive_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)
    adherence_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="computed", nullable=False)
