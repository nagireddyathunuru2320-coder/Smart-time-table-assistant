from collections.abc import Sequence
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class Repository(Generic[ModelT]):
    def __init__(self, session: Session, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    def get(self, item_id: int) -> ModelT | None:
        return self.session.get(self.model, item_id)

    def list_for_user(self, user_id: int, limit: int = 100, offset: int = 0) -> Sequence[ModelT]:
        statement = (
            select(self.model)
            .where(getattr(self.model, "user_id") == user_id)
            .limit(limit)
            .offset(offset)
        )
        return self.session.scalars(statement).all()

    def add(self, item: ModelT) -> ModelT:
        self.session.add(item)
        self.session.flush()
        return item

    def delete(self, item: ModelT) -> None:
        self.session.delete(item)
