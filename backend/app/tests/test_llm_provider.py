"""Tests LLM JSON parsing and fallback without real Groq calls."""
from datetime import datetime, timezone
from types import SimpleNamespace

from app.ai.llm_provider import LLMProvider


def _fake_response(text: str):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


def _provider_with_fake_client(create_fn):
    provider = LLMProvider.__new__(LLMProvider)
    provider._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=create_fn))
    )
    return provider


def test_llm_provider_parses_valid_json_response():
    provider = _provider_with_fake_client(
        lambda **kwargs: _fake_response(
            '{"intent": "create_task", "title": "finish essay", '
            '"deadline": "2026-09-10T23:59:00+00:00", "start": null, "end": null, "priority": 5}'
        )
    )
    result = provider.parse("add a task to finish essay by friday, high priority", datetime.now(timezone.utc))
    assert result.intent == "create_task"
    assert result.title == "finish essay"
    assert result.priority == 5
    assert result.deadline is not None


def test_llm_provider_falls_back_to_mock_on_malformed_json():
    provider = _provider_with_fake_client(lambda **kwargs: _fake_response("not json at all"))
    result = provider.parse("when am I free this week", datetime.now(timezone.utc))
    assert result.intent == "free_time_query"


def test_llm_provider_falls_back_to_mock_on_api_error():
    def raise_error(**kwargs):
        raise RuntimeError("network error")

    provider = _provider_with_fake_client(raise_error)
    result = provider.parse("cancel", datetime.now(timezone.utc))
    assert result.intent == "cancel"
