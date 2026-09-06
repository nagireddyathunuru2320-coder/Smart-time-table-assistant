from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class AssistantConversation(TimestampMixin, Base):
    __tablename__ = "assistant_conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), default="Scheduling conversation", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    messages = relationship(
        "AssistantMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


class AssistantMessage(TimestampMixin, Base):
    __tablename__ = "assistant_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("assistant_conversations.id", ondelete="CASCADE"),
        index=True,
    )
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    structured_intent: Mapped[str | None] = mapped_column(Text, nullable=True)
    validation_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    conversation = relationship("AssistantConversation", back_populates="messages")
