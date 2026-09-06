from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class Conflict(TimestampMixin, Base):
    __tablename__ = "conflicts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    conflict_type: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(40), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    affected_entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    affected_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    secondary_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    recommendations = relationship("SchedulingRecommendation", back_populates="conflict")


class SchedulingRecommendation(TimestampMixin, Base):
    __tablename__ = "scheduling_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    conflict_id: Mapped[int | None] = mapped_column(ForeignKey("conflicts.id", ondelete="CASCADE"), index=True)
    recommendation_type: Mapped[str] = mapped_column(String(80), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    proposed_changes: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)

    conflict = relationship("Conflict", back_populates="recommendations")
