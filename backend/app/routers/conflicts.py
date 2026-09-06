from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import Conflict, User
from app.schemas.conflict import ConflictRead, ConflictUpdate
from app.services.conflict_service import sync_conflicts_for_user

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


@router.get("", response_model=list[ConflictRead])
def list_conflicts(
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Conflict]:
    sync_conflicts_for_user(db, current_user.id)

    stmt = select(Conflict).where(Conflict.user_id == current_user.id)
    if status_filter is not None:
        stmt = stmt.where(Conflict.status == status_filter)
    stmt = stmt.order_by(Conflict.created_at.desc())
    return list(db.scalars(stmt).all())


@router.patch("/{conflict_id}", response_model=ConflictRead)
def update_conflict(
    conflict_id: int,
    payload: ConflictUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Conflict:
    conflict = db.get(Conflict, conflict_id)
    if conflict is None or conflict.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conflict not found")

    if payload.status is not None:
        conflict.status = payload.status

    db.commit()
    db.refresh(conflict)
    return conflict

