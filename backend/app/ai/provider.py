"""Provider abstraction for mock and Groq-backed intent parsing."""
from __future__ import annotations

from datetime import datetime

from app.ai.intent_parser import ParsedIntent, parse_intent
from app.config import settings


class AIProvider:
    def parse(self, text: str, now: datetime) -> ParsedIntent:
        raise NotImplementedError


class MockProvider(AIProvider):
    def parse(self, text: str, now: datetime) -> ParsedIntent:
        return parse_intent(text, now)


def get_provider() -> AIProvider:
    if settings.ai_provider == "llm" and settings.groq_api_key:
        from app.ai.llm_provider import LLMProvider

        return LLMProvider()
    return MockProvider()
