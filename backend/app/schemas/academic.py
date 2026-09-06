from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=50)
    color: str = Field(default="#2563eb", max_length=20)
    instructor: str | None = Field(default=None, max_length=255)
    difficulty: int = Field(default=3, ge=1, le=5)
    weekly_target_minutes: int = Field(default=180, ge=0, le=10080)
    notes: str | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=20)
    instructor: str | None = Field(default=None, max_length=255)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    weekly_target_minutes: int | None = Field(default=None, ge=0, le=10080)
    notes: str | None = None


class SubjectRead(SubjectBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    subject_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    task_type: str = Field(default="assignment", max_length=50)
    priority: int = Field(default=3, ge=1, le=5)
    difficulty: int = Field(default=3, ge=1, le=5)
    estimated_minutes: int = Field(default=60, ge=1, le=10080)
    completed_minutes: int = Field(default=0, ge=0, le=10080)
    deadline_at: datetime | None = None
    status: str = Field(default="pending", max_length=50)
    completed_at: datetime | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    subject_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    task_type: str | None = Field(default=None, max_length=50)
    priority: int | None = Field(default=None, ge=1, le=5)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    estimated_minutes: int | None = Field(default=None, ge=1, le=10080)
    completed_minutes: int | None = Field(default=None, ge=0, le=10080)
    deadline_at: datetime | None = None
    status: str | None = Field(default=None, max_length=50)
    completed_at: datetime | None = None


class TaskRead(TaskBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class ExamBase(BaseModel):
    subject_id: int | None = None
    title: str = Field(min_length=1, max_length=255)
    exam_at: datetime
    duration_minutes: int = Field(default=120, ge=1, le=1440)
    location: str | None = Field(default=None, max_length=255)
    difficulty: int = Field(default=3, ge=1, le=5)
    priority: int = Field(default=5, ge=1, le=5)
    study_required_minutes: int = Field(default=360, ge=0, le=10080)
    notes: str | None = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    subject_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    exam_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)
    location: str | None = Field(default=None, max_length=255)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    priority: int | None = Field(default=None, ge=1, le=5)
    study_required_minutes: int | None = Field(default=None, ge=0, le=10080)
    notes: str | None = None


class ExamRead(ExamBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
