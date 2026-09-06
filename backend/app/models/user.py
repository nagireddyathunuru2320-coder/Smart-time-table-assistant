from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        default="Asia/Kolkata",
        nullable=False,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    study_goal_minutes_per_week: Mapped[int] = mapped_column(
        Integer,
        default=900,
        nullable=False,
    )

    preferences = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    calendar_accounts = relationship("CalendarAccount", back_populates="user")
    subjects = relationship("Subject", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    exams = relationship("Exam", back_populates="user")
    study_sessions = relationship("StudySession", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
