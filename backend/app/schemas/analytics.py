from datetime import date, datetime

from pydantic import BaseModel


class DailyTrendPointRead(BaseModel):
    day: date
    planned_minutes: int
    actual_minutes: int


class SubjectBreakdownItemRead(BaseModel):
    subject_id: int | None
    subject_name: str
    subject_color: str
    minutes: int


class UpcomingExamItemRead(BaseModel):
    id: int
    title: str
    exam_at: datetime
    days_until: int


class AnalyticsSummaryRead(BaseModel):
    weekly_study_minutes: int
    weekly_goal_minutes: int
    task_completion_rate: float
    tasks_completed: int
    tasks_pending: int
    tasks_overdue: int
    upcoming_exams: list[UpcomingExamItemRead]
    daily_trend: list[DailyTrendPointRead]
    subject_breakdown: list[SubjectBreakdownItemRead]
