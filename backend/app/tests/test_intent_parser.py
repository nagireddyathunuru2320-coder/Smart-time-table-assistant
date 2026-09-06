from datetime import datetime, timezone

from app.ai.intent_parser import parse_intent


def _now():
    return datetime(2026, 9, 4, 10, 0, tzinfo=timezone.utc)


def test_parses_create_task_with_deadline_and_priority():
    parsed = parse_intent("add a task to finish my essay by tomorrow, high priority", _now())
    assert parsed.intent == "create_task"
    assert "essay" in parsed.title.lower()
    assert parsed.priority == 5
    assert parsed.deadline is not None


def test_parses_create_event_with_time_range():
    parsed = parse_intent("schedule a meeting from 2pm to 4pm tomorrow", _now())
    assert parsed.intent == "create_event"
    assert "meeting" in parsed.title.lower()
    assert parsed.start.hour == 14
    assert parsed.end.hour == 16


def test_parses_free_time_query():
    assert parse_intent("when am I free this week", _now()).intent == "free_time_query"


def test_parses_generate_study_plan():
    assert parse_intent("generate my study plan", _now()).intent == "generate_study_plan"


def test_parses_confirm():
    assert parse_intent("yes", _now()).intent == "confirm"


def test_parses_cancel():
    assert parse_intent("cancel", _now()).intent == "cancel"


def test_unknown_for_unrelated_text():
    assert parse_intent("what's the weather like", _now()).intent == "unknown"
