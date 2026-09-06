from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import (
    CalendarEvent,
    Exam,
    Subject,
    Task,
    User,
    UserPreference,
)


DEMO_EMAIL = "demo.student@example.com"


def run() -> None:
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.email == DEMO_EMAIL))
        if user is None:
            user = User(
                email=DEMO_EMAIL,
                full_name="Demo Student",
                password_hash="pending-auth-phase",
                timezone="Asia/Kolkata",
            )
            session.add(user)
            session.flush()
            session.add(UserPreference(user_id=user.id))

        dbms = session.scalar(
            select(Subject).where(Subject.user_id == user.id, Subject.code == "DBMS")
        )
        if dbms is None:
            dbms = Subject(
                user_id=user.id,
                name="Database Management Systems",
                code="DBMS",
                color="#2563eb",
                difficulty=4,
                weekly_target_minutes=240,
            )
            session.add(dbms)
            session.flush()

        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

        if not session.scalar(select(Task).where(Task.user_id == user.id, Task.title == "Normalize schema assignment")):
            session.add(
                Task(
                    user_id=user.id,
                    subject_id=dbms.id,
                    title="Normalize schema assignment",
                    description="Prepare ER model and normalization notes.",
                    priority=4,
                    difficulty=4,
                    estimated_minutes=180,
                    deadline_at=now + timedelta(days=5),
                )
            )

        if not session.scalar(select(Exam).where(Exam.user_id == user.id, Exam.title == "DBMS midterm")):
            session.add(
                Exam(
                    user_id=user.id,
                    subject_id=dbms.id,
                    title="DBMS midterm",
                    exam_at=now + timedelta(days=10),
                    duration_minutes=120,
                    difficulty=4,
                    study_required_minutes=480,
                )
            )

        if not session.scalar(select(CalendarEvent).where(CalendarEvent.user_id == user.id, CalendarEvent.title == "DBMS lecture")):
            session.add(
                CalendarEvent(
                    user_id=user.id,
                    title="DBMS lecture",
                    event_type="lecture",
                    start_at=now + timedelta(days=1, hours=4),
                    end_at=now + timedelta(days=1, hours=5),
                    timezone="Asia/Kolkata",
                    source="local",
                    priority=4,
                )
            )

        session.commit()
        print(f"Seeded demo data for {DEMO_EMAIL}")


if __name__ == "__main__":
    run()
