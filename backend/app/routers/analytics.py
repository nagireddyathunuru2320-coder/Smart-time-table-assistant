from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import User
from app.schemas.analytics import AnalyticsSummaryRead
from app.services.analytics_service import get_analytics_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryRead)
def get_summary(
    days: int = Query(default=14, ge=7, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummaryRead:
    summary = get_analytics_summary(db, current_user, trend_days=days)
    return AnalyticsSummaryRead(
        weekly_study_minutes=summary.weekly_study_minutes,
        weekly_goal_minutes=summary.weekly_goal_minutes,
        task_completion_rate=summary.task_completion_rate,
        tasks_completed=summary.tasks_completed,
        tasks_pending=summary.tasks_pending,
        tasks_overdue=summary.tasks_overdue,
        upcoming_exams=[u.__dict__ for u in summary.upcoming_exams],
        daily_trend=[d.__dict__ for d in summary.daily_trend],
        subject_breakdown=[s.__dict__ for s in summary.subject_breakdown],
    )
