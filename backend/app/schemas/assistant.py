from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConversationRead(BaseModel):
    id: int
    user_id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    validation_status: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SendMessageRequest(BaseModel):
    content: str
    conversation_id: int | None = None


class SendMessageResponse(BaseModel):
    conversation_id: int
    user_message: MessageRead
    assistant_message: MessageRead
