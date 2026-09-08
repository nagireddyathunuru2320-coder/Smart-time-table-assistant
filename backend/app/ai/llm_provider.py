"""Real LLM-backed intent parser using Groq's OpenAI-compatible API."""
from __future__ import annotations

import json
import re
from datetime import datetime

from openai import OpenAI

from app.ai.intent_parser import ParsedIntent, parse_intent
from app.config import settings

_TRAILING_CLAUSE_RE = re.compile(
    r"[,\-–—]?\s*(it'?s|it is)\s+(pretty\s+|really\s+|very\s+)?"
    r"(important|urgent|high priority|low priority|not urgent|whenever)\s*[.!]?\s*$",
    re.IGNORECASE,
)
_LEADING_FILLER_RE = re.compile(
    r"^(that\s+|to\s+)+",
    re.IGNORECASE,
)


def _clean_title(title: str | None) -> str | None:
    """Deterministic cleanup applied on top of the LLM's title output.

    The LLM is instructed to strip priority/deadline language from titles,
    but doesn't always comply for every phrasing (models aren't perfectly
    deterministic). This regex pass is a backstop: it trims common trailing
    clauses like "it's pretty important" that occasionally survive, so
    title quality doesn't depend entirely on the model following
    instructions correctly every time.
    """
    if not title:
        return title
    cleaned = _TRAILING_CLAUSE_RE.sub("", title).strip()
    cleaned = _LEADING_FILLER_RE.sub("", cleaned).strip()
    return cleaned or title

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are an intent-extraction engine for a student scheduling assistant. \
Given a user's message and the current date/time, output ONLY a single JSON object (no prose, \
no markdown fences, nothing else) with these exact fields:

{
  "intent": one of "create_task" | "create_event" | "free_time_query" | "generate_study_plan" | "confirm" | "cancel" | "unknown",
  "title": string or null,
  "deadline": ISO 8601 datetime string or null (only for create_task),
  "start": ISO 8601 datetime string or null (only for create_event),
  "end": ISO 8601 datetime string or null (only for create_event),
  "priority": integer 1-5 or null
}

Rules:
- "title" must be ONLY the core task or event name - a short noun phrase, never a full sentence.
    Strip out ALL scheduling language (deadlines, dates, times, "by", "due", "sometime", "next week")
    and ALL priority language ("high priority", "it's important", "urgent", "asap") from the title.
    Example: "remind me to submit my ML assignment sometime next week, it's pretty important" ->
    title should be "Submit ML assignment", NOT the full sentence.
    Example: "add a task to finish the lab report by friday" -> title should be "Finish the lab report".
    Capitalize the title naturally as a short task name would normally be written.
- Resolve relative dates ("tomorrow", "friday", "in 3 days") against the given current datetime.
- "high priority" / "urgent" / "asap" / "important" -> priority 5. "low priority" / "whenever" -> priority 1. Otherwise null.
- If the message clearly confirms a pending action ("yes", "confirm", "go ahead", "sounds good") -> intent "confirm".
- If it clearly cancels ("no", "cancel", "nevermind", "stop") -> intent "cancel".
- If it asks about free time / availability -> intent "free_time_query".
- If it asks to generate/build/create a study plan -> intent "generate_study_plan".
- If none of the above clearly apply, or the message is unrelated to scheduling -> intent "unknown".
- Output nothing except the JSON object. No explanation, no markdown."""


class LLMProvider:
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.groq_api_key, base_url=GROQ_BASE_URL)

    def parse(self, text: str, now: datetime) -> ParsedIntent:
        try:
            response = self._client.chat.completions.create(
                model=MODEL,
                max_tokens=300,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Current datetime: {now.isoformat()}\nMessage: {text}",
                    },
                ],
            )
            raw_text = response.choices[0].message.content or ""
            cleaned = raw_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
            data = json.loads(cleaned)
            return ParsedIntent(
                intent=data.get("intent", "unknown"),
                title=_clean_title(data.get("title")),
                deadline=datetime.fromisoformat(data["deadline"]) if data.get("deadline") else None,
                start=datetime.fromisoformat(data["start"]) if data.get("start") else None,
                end=datetime.fromisoformat(data["end"]) if data.get("end") else None,
                priority=data.get("priority"),
                raw_text=text,
            )
        except Exception:
            return parse_intent(text, now)
