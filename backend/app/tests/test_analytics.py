from datetime import date, datetime, timedelta, timezone

from app.analytics.compute import ExamInfo, StudyBlockInfo, TaskInfo, compute_analytics


def _now():
    return datetime(2026, 9, 10, 12, 0, tzinfo=timezone.utc)


def test_weekly_study_minutes_only_counts_past_blocks_in_last_7_days():
    now = _now()
    past_block = StudyBlockInfo(
        start_at=now - timedelta(days=2, hours=1), end_at=now - timedelta(days=2), subject_id=None
    )
    future_block = StudyBlockInfo(
        start_at=now + timedelta(days=1), end_at=now + timedelta(days=1, hours=1), subject_id=None
    )
    old_block = StudyBlockInfo(
        start_at=now - timedelta(days=10, hours=1), end_at=now - timedelta(days=10), subject_id=None
    )
    summary = compute_analytics(
        now=now,
        tasks=[],
        exams=[],
        study_blocks=[past_block, future_block, old_block],
        weekly_goal_minutes=300,
        subject_lookup={},
    )
    assert summary.weekly_study_minutes == 60


def test_task_completion_rate_and_counts():
    now = _now()
    tasks = [
        TaskInfo(status="completed", deadline_at=now - timedelta(days=1)),
        TaskInfo(status="completed", deadline_at=None),
        TaskInfo(status="pending", deadline_at=now + timedelta(days=1)),
        TaskInfo(status="pending", deadline_at=now - timedelta(days=1)),
    ]
    summary = compute_analytics(
        now=now, tasks=tasks, exams=[], study_blocks=[], weekly_goal_minutes=300, subject_lookup={}
    )
    assert summary.tasks_completed == 2
    assert summary.tasks_overdue == 1
    assert summary.tasks_pending == 1
    assert summary.task_completion_rate == 50.0


def test_upcoming_exams_excludes_past_and_sorts_by_date():
    now = _now()
    exams = [
        ExamInfo(id=1, title="Past exam", exam_at=now - timedelta(days=1)),
        ExamInfo(id=2, title="Later exam", exam_at=now + timedelta(days=10)),
        ExamInfo(id=3, title="Soon exam", exam_at=now + timedelta(days=2)),
    ]
    summary = compute_analytics(
        now=now, tasks=[], exams=exams, study_blocks=[], weekly_goal_minutes=300, subject_lookup={}
    )
    assert [e.title for e in summary.upcoming_exams] == ["Soon exam", "Later exam"]
    assert summary.upcoming_exams[0].days_until == 2


def test_daily_trend_separates_planned_from_actual():
    now = _now()
    today_past_block = StudyBlockInfo(
        start_at=now - timedelta(hours=2), end_at=now - timedelta(hours=1), subject_id=None
    )
    today_future_block = StudyBlockInfo(
        start_at=now + timedelta(hours=1), end_at=now + timedelta(hours=2), subject_id=None
    )
    summary = compute_analytics(
        now=now,
        tasks=[],
        exams=[],
        study_blocks=[today_past_block, today_future_block],
        weekly_goal_minutes=300,
        subject_lookup={},
        trend_days=3,
    )
    today_point = next(p for p in summary.daily_trend if p.day == now.date())
    assert today_point.planned_minutes == 120
    assert today_point.actual_minutes == 60


def test_subject_breakdown_groups_unknown_as_other():
    now = _now()
    blocks = [
        StudyBlockInfo(start_at=now - timedelta(hours=2), end_at=now - timedelta(hours=1), subject_id=1),
        StudyBlockInfo(start_at=now - timedelta(hours=4), end_at=now - timedelta(hours=3), subject_id=None),
    ]
    summary = compute_analytics(
        now=now,
        tasks=[],
        exams=[],
        study_blocks=blocks,
        weekly_goal_minutes=300,
        subject_lookup={1: ("Math", "#6D5DFC")},
    )
    names = {b.subject_name for b in summary.subject_breakdown}
    assert names == {"Math", "Other"}


def test_subject_breakdown_excludes_future_blocks():
    now = _now()
    future_block = StudyBlockInfo(
        start_at=now + timedelta(hours=1), end_at=now + timedelta(hours=2), subject_id=1
    )
    summary = compute_analytics(
        now=now,
        tasks=[],
        exams=[],
        study_blocks=[future_block],
        weekly_goal_minutes=300,
        subject_lookup={1: ("Math", "#6D5DFC")},
    )
    assert summary.subject_breakdown == []
