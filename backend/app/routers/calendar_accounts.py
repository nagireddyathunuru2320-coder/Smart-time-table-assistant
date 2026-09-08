from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.dependencies import get_db
from app.models import CalendarAccount, User
from app.schemas.calendar_account import AuthorizeUrlResponse, CalendarAccountRead, SyncLogRead
from app.services.calendar_sync_service import (
    disconnect_account,
    get_authorize_url,
    handle_oauth_callback,
    list_accounts,
    sync_account,
)

router = APIRouter(prefix="/calendar-accounts", tags=["calendar-accounts"])


@router.get("", response_model=list[CalendarAccountRead])
def get_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarAccount]:
    return list_accounts(db, current_user)


@router.get("/google/authorize-url", response_model=AuthorizeUrlResponse)
def google_authorize_url(current_user: User = Depends(get_current_user)) -> AuthorizeUrlResponse:
    return AuthorizeUrlResponse(url=get_authorize_url(current_user))


@router.get("/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)) -> RedirectResponse:
    try:
        handle_oauth_callback(db, code, state)
        return RedirectResponse(url=f"{settings.frontend_url}/settings?calendar_connected=1")
    except ValueError as exc:
        return RedirectResponse(url=f"{settings.frontend_url}/settings?calendar_error={str(exc)[:200]}")


@router.post("/{account_id}/sync", response_model=SyncLogRead)
def trigger_sync(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SyncLogRead:
    account = db.get(CalendarAccount, account_id)
    if account is None or account.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar account not found")
    return sync_account(db, account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    try:
        disconnect_account(db, current_user, account_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar account not found")
