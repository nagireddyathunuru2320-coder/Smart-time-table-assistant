# Scheduling Algorithm

The scheduling engine must be deterministic, explainable, and testable without FastAPI or an LLM.

## Planned Modules
- Free-slot detection across local and provider events.
- Conflict detection for overlaps, deadline collisions, overload, and impossible schedules.
- Priority and urgency scoring.
- Study allocation and time blocking.
- Recommendation ranking and rescheduling.
- Predictive preference adjustments from productivity records.

## Scoring Inputs
Priority, deadline urgency, difficulty, estimated duration, preferred study hours, productive history, workload balance, breaks, buffers, and existing commitments.

LLMs may explain or translate natural language into structured requests, but scheduling decisions must pass through validated services.
