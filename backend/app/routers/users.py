from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import User, UserPreference
from app.schemas.auth import PreferenceRead, PreferenceUpdate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/preferences", response_model=PreferenceRead)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreference:
    if current_user.preferences is None:
        current_user.preferences = UserPreference(user_id=current_user.id)
        db.commit()
        db.refresh(current_user.preferences)
    return current_user.preferences


@router.patch("/me/preferences", response_model=PreferenceRead)
def update_preferences(
    payload: PreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreference:
    preferences = current_user.preferences
    if preferences is None:
        preferences = UserPreference(user_id=current_user.id)
        db.add(preferences)
        db.flush()

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(preferences, field, value)

    db.commit()
    db.refresh(preferences)
    return preferences
