"""Provider abstraction for the AI assistant's natural-language understanding.

Only a mock (pattern-based) provider is implemented right now, satisfying
 the project's mock/free-first requirement — zero external calls, zero cost.
A real LLM-backed provider can be added later behind this same parse()
interface; intent_parser.parse_intent() is the sole swap point.
"""
from __future__ import annotations

from datetime import datetime

from app.ai.intent_parser import ParsedIntent, parse_intent


class AIProvider:
    def parse(self, text: str, now: datetime) -> ParsedIntent:
        raise NotImplementedError


class MockProvider(AIProvider):
    def parse(self, text: str, now: datetime) -> ParsedIntent:
        return parse_intent(text, now)


def get_provider() -> AIProvider:
    return MockProvider()
