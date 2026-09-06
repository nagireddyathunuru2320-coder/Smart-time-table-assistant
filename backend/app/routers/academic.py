from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.dependencies import get_db
from app.models import Exam, Subject, Task, User
from app.schemas.academic import (
    ExamCreate,
    ExamRead,
    ExamUpdate,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
)

router = APIRouter(tags=["academic"])


@router.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    subject = Subject(user_id=current_user.id, **payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/subjects", response_model=list[SubjectRead])
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Subject]:
    return list(db.scalars(select(Subject).where(Subject.user_id == current_user.id)).all())


@router.get("/subjects/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    return _get_owned(db, Subject, subject_id, current_user.id)


@router.patch("/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Subject:
    subject = _get_owned(db, Subject, subject_id, current_user.id)
    _apply_updates(subject, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    subject = _get_owned(db, Subject, subject_id, current_user.id)
    db.delete(subject)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    data = payload.model_dump()
    _validate_subject(db, data.get("subject_id"), current_user.id)
    task = Task(user_id=current_user.id, **data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Task]:
    return list(db.scalars(select(Task).where(Task.user_id == current_user.id)).all())


@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    return _get_owned(db, Task, task_id, current_user.id)


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Task:
    task = _get_owned(db, Task, task_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)
    _validate_subject(db, data.get("subject_id"), current_user.id)
    _apply_updates(task, data)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    task = _get_owned(db, Task, task_id, current_user.id)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/exams", response_model=ExamRead, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Exam:
    data = payload.model_dump()
    _validate_subject(db, data.get("subject_id"), current_user.id)
    exam = Exam(user_id=current_user.id, **data)
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/exams", response_model=list[ExamRead])
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Exam]:
    return list(db.scalars(select(Exam).where(Exam.user_id == current_user.id)).all())


@router.get("/exams/{exam_id}", response_model=ExamRead)
def get_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Exam:
    return _get_owned(db, Exam, exam_id, current_user.id)


@router.patch("/exams/{exam_id}", response_model=ExamRead)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Exam:
    exam = _get_owned(db, Exam, exam_id, current_user.id)
    data = payload.model_dump(exclude_unset=True)
    _validate_subject(db, data.get("subject_id"), current_user.id)
    _apply_updates(exam, data)
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    exam = _get_owned(db, Exam, exam_id, current_user.id)
    db.delete(exam)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_owned(db: Session, model: type[Subject] | type[Task] | type[Exam], item_id: int, user_id: int):
    item = db.get(model, item_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return item


def _validate_subject(db: Session, subject_id: int | None, user_id: int) -> None:
    if subject_id is None:
        return
    subject = db.get(Subject, subject_id)
    if subject is None or subject.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid subject_id")


def _apply_updates(item, updates: dict) -> None:
    for field, value in updates.items():
        setattr(item, field, value)
