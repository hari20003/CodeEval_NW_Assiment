from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

# =========================
# EXAM SETTINGS
# =========================

class ExamSettings(Base):
    __tablename__ = "exam_settings"

    id = Column(Integer, primary_key=True, index=True)
    is_open = Column(Boolean, default=False)
    duration = Column(Integer)   # minutes


# =========================
# USERS (STUDENTS)
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)

    first_name = Column(String(50))
    last_name = Column(String(50))

    password = Column(String(200), nullable=False)

    submissions = relationship(
        "Submission",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


# =========================
# STAFF
# =========================

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)


# =========================
# QUESTIONS
# =========================

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    qno = Column(Integer, unique=True, index=True, nullable=False)

    title = Column(String(200))
    description = Column(Text)

    type = Column(String(50))      # coding / debug
    buggyCode = Column(Text)


# =========================
# TEST CASES
# =========================

class TestCase(Base):
    __tablename__ = "testcases"

    id = Column(Integer, primary_key=True, index=True)
    qno = Column(Integer, index=True, nullable=False)

    input = Column(Text)
    expected_output = Column(Text)

    marks = Column(Integer, default=1)


# =========================
# SUBMISSIONS  ✅ UPDATED
# =========================

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    reg_no = Column(String(50))
    student_name = Column(String(100))

    qno = Column(Integer, nullable=False)
    language = Column(String(20))
    code = Column(Text)

    marks = Column(Integer, default=0)   # ✅ ADDED FOR AUTO MARKING

    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="submissions")
