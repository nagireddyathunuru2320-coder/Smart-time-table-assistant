from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import AssistantConversation, AssistantMessage, User
from app.schemas.assistant import ConversationRead, MessageRead, SendMessageRequest, SendMessageResponse
from app.services.assistant_service import get_or_create_conversation, handle_message

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AssistantConversation]:
    return list(
        db.scalars(
            select(AssistantConversation)
            .where(AssistantConversation.user_id == current_user.id)
            .order_by(AssistantConversation.updated_at.desc())
        ).all()
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageRead])
def list_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AssistantMessage]:
    conv = db.get(AssistantConversation, conversation_id)
    if conv is None or conv.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return list(
        db.scalars(
            select(AssistantMessage)
            .where(AssistantMessage.conversation_id == conversation_id)
            .order_by(AssistantMessage.id.asc())
        ).all()
    )


@router.post("/messages", response_model=SendMessageResponse)
def send_message(
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SendMessageResponse:
    try:
        conversation = get_or_create_conversation(db, current_user, payload.conversation_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    assistant_msg = handle_message(db, current_user, conversation, payload.content)

    user_msg = db.scalar(
        select(AssistantMessage)
        .where(AssistantMessage.conversation_id == conversation.id, AssistantMessage.role == "user")
        .order_by(AssistantMessage.id.desc())
        .limit(1)
    )

    return SendMessageResponse(
        conversation_id=conversation.id, user_message=user_msg, assistant_message=assistant_msg
    )
