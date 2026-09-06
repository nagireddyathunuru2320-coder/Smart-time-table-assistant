from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.config import settings
from app.dependencies import get_db
from app.models import User, UserPreference
from app.repositories.user import UserRepository
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    users = UserRepository(db)
    if users.get_by_email(payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        timezone=payload.timezone,
    )
    db.add(user)
    db.flush()
    db.add(UserPreference(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = UserRepository(db).get_by_email(payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(
        subject=str(user.id),
        secret_key=settings.secret_key,
        expires_minutes=settings.access_token_expire_minutes,
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"status": "ok"}
