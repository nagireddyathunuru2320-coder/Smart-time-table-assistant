"""Pure analytics computation - no DB access, so this is unit testable in
isolation. All inputs are already-fetched ORM objects / plain values.

Key assumption (documented, not hidden): calendar_events has no explicit
"did this study session actually happen" flag. A study_block event is
treated as "actual" (completed) study time once its end_at has passed, and
as merely "planned" time if it's still in the future. This is a reasonable
proxy given the data available, not a guarantee of real completion.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta


def _as_utc(value: datetime) -> datetime:
    """Treat naive database timestamps as UTC and normalize aware values."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


@dataclass
class DailyTrendPoint:
    day: date
    planned_minutes: int
    actual_minutes: int


@dataclass
class SubjectBreakdownItem:
    subject_id: int | None
    subject_name: str
    subject_color: str
    minutes: int


@dataclass
class UpcomingExamItem:
    id: int
    title: str
    exam_at: datetime
    days_until: int


@dataclass
class AnalyticsSummary:
    weekly_study_minutes: int
    weekly_goal_minutes: int
    task_completion_rate: float
    tasks_completed: int
    tasks_pending: int
    tasks_overdue: int
    upcoming_exams: list[UpcomingExamItem] = field(default_factory=list)
    daily_trend: list[DailyTrendPoint] = field(default_factory=list)
    subject_breakdown: list[SubjectBreakdownItem] = field(default_factory=list)


@dataclass
class StudyBlockInfo:
    start_at: datetime
    end_at: datetime
    subject_id: int | None


@dataclass
class TaskInfo:
    status: str
    deadline_at: datetime | None


@dataclass
class ExamInfo:
    exam_at: datetime
    title: str
    id: int


def compute_analytics(
    *,
    now: datetime,
    tasks: list[TaskInfo],
    exams: list[ExamInfo],
    study_blocks: list[StudyBlockInfo],
    weekly_goal_minutes: int,
    subject_lookup: dict[int, tuple[str, str]],
    trend_days: int = 14,
) -> AnalyticsSummary:
    now = _as_utc(now)
    study_blocks = [
        StudyBlockInfo(
            start_at=_as_utc(block.start_at),
            end_at=_as_utc(block.end_at),
            subject_id=block.subject_id,
        )
        for block in study_blocks
    ]
    tasks = [
        TaskInfo(
            status=task.status,
            deadline_at=_as_utc(task.deadline_at) if task.deadline_at is not None else None,
        )
        for task in tasks
    ]
    exams = [
        ExamInfo(exam_at=_as_utc(exam.exam_at), title=exam.title, id=exam.id)
        for exam in exams
    ]

    week_start = now - timedelta(days=7)
    weekly_study_minutes = sum(
        int((b.end_at - b.start_at).total_seconds() // 60)
        for b in study_blocks
        if b.end_at <= now and b.start_at >= week_start
    )

    tasks_completed = sum(1 for t in tasks if t.status == "completed")
    tasks_overdue = sum(
        1
        for t in tasks
        if t.status != "completed" and t.deadline_at is not None and t.deadline_at < now
    )
    tasks_pending = sum(
        1
        for t in tasks
        if t.status != "completed"
        and (t.deadline_at is None or t.deadline_at >= now)
    )
    total_considered = tasks_completed + tasks_overdue + tasks_pending
    task_completion_rate = (
        round(100 * tasks_completed / total_considered, 1) if total_considered > 0 else 0.0
    )

    upcoming_exams = sorted(
        (
            UpcomingExamItem(
                id=e.id,
                title=e.title,
                exam_at=e.exam_at,
                days_until=(e.exam_at.date() - now.date()).days,
            )
            for e in exams
            if e.exam_at > now
        ),
        key=lambda u: u.exam_at,
    )[:5]

    trend_start_date = now.date() - timedelta(days=trend_days - 1)
    trend_by_day: dict[date, list[int]] = {
        trend_start_date + timedelta(days=i): [0, 0] for i in range(trend_days)
    }
    for block in study_blocks:
        block_day = block.start_at.date()
        if block_day in trend_by_day:
            minutes = int((block.end_at - block.start_at).total_seconds() // 60)
            trend_by_day[block_day][0] += minutes
            if block.end_at <= now:
                trend_by_day[block_day][1] += minutes

    daily_trend = [
        DailyTrendPoint(day=d, planned_minutes=v[0], actual_minutes=v[1])
        for d, v in sorted(trend_by_day.items())
    ]

    subject_minutes: dict[int | None, int] = {}
    for block in study_blocks:
        if block.end_at > now:
            continue
        minutes = int((block.end_at - block.start_at).total_seconds() // 60)
        subject_minutes[block.subject_id] = subject_minutes.get(block.subject_id, 0) + minutes

    subject_breakdown = []
    for subject_id, minutes in sorted(subject_minutes.items(), key=lambda kv: -kv[1]):
        if subject_id is not None and subject_id in subject_lookup:
            name, color = subject_lookup[subject_id]
        else:
            name, color = "Other", "#9BA3B4"
        subject_breakdown.append(
            SubjectBreakdownItem(
                subject_id=subject_id,
                subject_name=name,
                subject_color=color,
                minutes=minutes,
            )
        )

    return AnalyticsSummary(
        weekly_study_minutes=weekly_study_minutes,
        weekly_goal_minutes=weekly_goal_minutes,
        task_completion_rate=task_completion_rate,
        tasks_completed=tasks_completed,
        tasks_pending=tasks_pending,
        tasks_overdue=tasks_overdue,
        upcoming_exams=upcoming_exams,
        daily_trend=daily_trend,
        subject_breakdown=subject_breakdown,
    )
