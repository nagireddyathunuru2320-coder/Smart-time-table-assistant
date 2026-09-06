from datetime import datetime

from pydantic import BaseModel


class FreeSlotRead(BaseModel):
    start: datetime
    end: datetime
    duration_minutes: int

