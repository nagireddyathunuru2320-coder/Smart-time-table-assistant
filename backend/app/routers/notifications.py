from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import Notification, User
from app.schemas.notification import NotificationRead, NotificationUpdate
from app.services.notification_service import sync_notifications_for_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notification]:
    sync_notifications_for_user(db, current_user)

    stmt = select(Notification).where(Notification.user_id == current_user.id)
    if status_filter is not None:
        stmt = stmt.where(Notification.status == status_filter)
    stmt = stmt.order_by(Notification.created_at.desc())
    return list(db.scalars(stmt).all())


@router.post("/mark-all-read", response_model=list[NotificationRead])
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notification]:
    sync_notifications_for_user(db, current_user)

    unread = list(
        db.scalars(
            select(Notification).where(
                Notification.user_id == current_user.id,
                Notification.status == "unread",
            )
        ).all()
    )
    for notification in unread:
        notification.status = "read"
    db.commit()

    return list(
        db.scalars(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
        ).all()
    )


@router.patch("/{notification_id}", response_model=NotificationRead)
def update_notification(
    notification_id: int,
    payload: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    if payload.status is not None:
        notification.status = payload.status

    db.commit()
    db.refresh(notification)
    return notification
