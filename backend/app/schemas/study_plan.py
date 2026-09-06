from datetime import datetime

from pydantic import BaseModel


class StudyPlanBlock(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    title: str
    start_at: datetime
    end_at: datetime


class UnmetNeed(BaseModel):
    entity_type: str
    entity_id: int
    title: str
    unmet_minutes: int


class NeedConsidered(BaseModel):
    entity_type: str
    entity_id: int
    title: str
    deadline: str
    remaining_minutes: int
    priority: int


class StudyPlanResponse(BaseModel):
    horizon_days: int
    created: list[StudyPlanBlock]
    unmet: list[UnmetNeed]
    needs_considered: list[NeedConsidered]
