from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from passlib.context import CryptContext
from datetime import datetime, timedelta

from database import SessionLocal, engine
from models import *
from executor import run_python, run_testcases

from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime
import json
from datetime import datetime, timedelta
from fastapi import Response, HTTPException, Depends

from datetime import datetime
import json
from fastapi.responses import PlainTextResponse

# =====================================================
# APP INIT
# =====================================================

app = FastAPI(title="HumanXCode Exam Backend")

# =====================================================
# PASSWORD HASHING
# =====================================================

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)
app = FastAPI()

# ================= CREATE DEFAULT STAFF =================
@app.on_event("startup")
def seed_staff():
    db = SessionLocal()
    try:
        existing = db.query(Staff).filter(Staff.username == "admin").first()
        if not existing:
            s = Staff(
                username="admin",
                email="admin@humanxcode.com",
                password=hash_password("admin123")
            )
            db.add(s)
            db.commit()
            print("✅ Default staff created")
    finally:
        db.close()

# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# DB INIT
# =====================================================

Base.metadata.create_all(bind=engine, checkfirst=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {"status": "HumanXCode Backend Running"}

# =====================================================
# AUTH - STUDENT
# =====================================================

@app.post("/api/auth/register")
def register_user(data: dict, db: Session = Depends(get_db)):

    if db.query(User).filter(
        or_(
            User.username == data["username"],
            User.email == data["email"],
            User.phone == data["phone"]
        )
    ).first():
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=data["username"],
        email=data["email"],
        phone=data["phone"],
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        password=hash_password(data["password"])
    )

    db.add(user)
    db.commit()
    return {"status": "registered"}

@app.post("/api/auth/login")
def login_user(data: dict, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        or_(
            User.username == data["login"],
            User.email == data["login"],
            User.phone == data["login"]
        )
    ).first()

    if not user or not verify_password(data["password"], user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }

# =====================================================
# AUTH - STAFF
# =====================================================

@app.post("/api/staff/login")
def staff_login(data: dict, db: Session = Depends(get_db)):

    staff = db.query(Staff).filter(Staff.username == data["username"]).first()

    if not staff or not verify_password(data["password"], staff.password):
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    return {
        "status": "success",
        "staff": {
            "id": staff.id,
            "username": staff.username,
            "email": staff.email
        }
    }
@app.get("/debug/staff")
def debug_staff(db: Session = Depends(get_db)):
    staff_list = db.query(Staff).all()
    return [{"id": s.id, "username": s.username, "email": s.email} for s in staff_list]

# =====================================================
# EXAM SETTINGS
# =====================================================

@app.get("/api/exam-settings")
def exam_settings(db: Session = Depends(get_db)):
    s = db.query(ExamSettings).first()
    return {"is_open": s.is_open if s else False, "duration": s.duration if s else 0}

@app.post("/api/staff/exam-settings")
def set_exam_settings(data: dict, db: Session = Depends(get_db)):

    s = db.query(ExamSettings).first()
    if not s:
        s = ExamSettings(**data)
        db.add(s)
    else:
        s.is_open = data["is_open"]
        s.duration = data["duration"]

    db.commit()
    return {"status": "updated"}

# =====================================================
# QUESTIONS
# =====================================================

@app.get("/api/questions")
def get_questions(db: Session = Depends(get_db)):
    return db.query(Question).order_by(Question.qno).all()

@app.post("/api/staff/set-question")
def staff_set_question(data: dict, db: Session = Depends(get_db)):

    if data["qno"] not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Only 4 questions allowed")

    q = db.query(Question).filter(Question.qno == data["qno"]).first()

    if q:
        q.title = data["title"]
        q.description = data["description"]
        q.type = data["type"]
        q.buggyCode = data.get("buggyCode", "")
    else:
        db.add(Question(**data))

    db.commit()
    return {"status": "saved"}

# =====================================================
# TEST CASES
# =====================================================

@app.get("/api/student/testcases/{qno}")
def get_testcases(qno: int, db: Session = Depends(get_db)):
    return db.query(TestCase).filter(TestCase.qno == qno).all()

@app.get("/api/staff/testcases/{qno}")
def staff_get_testcases(qno: int, db: Session = Depends(get_db)):
    return db.query(TestCase).filter(TestCase.qno == qno).all()

@app.post("/api/staff/testcases")
def staff_add_testcase(data: dict, db: Session = Depends(get_db)):

    if db.query(TestCase).filter(TestCase.qno == data["qno"]).count() >= 4:
        raise HTTPException(status_code=400, detail="Only 4 testcases allowed")

    db.add(TestCase(**data))
    db.commit()
    return {"status": "added"}

@app.delete("/api/staff/testcases/{tc_id}")
def staff_delete_testcase(tc_id: int, db: Session = Depends(get_db)):

    tc = db.query(TestCase).filter(TestCase.id == tc_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Testcase not found")

    db.delete(tc)
    db.commit()
    return {"status": "deleted"}

# =====================================================
# RUN CODE
# =====================================================

@app.post("/api/run")
def run_code(data: dict, db: Session = Depends(get_db)):

    code = data.get("code", "")
    qno = data.get("qno")
    custom_input = data.get("input", "")

    testcases = db.query(TestCase).filter(TestCase.qno == qno).all()
    tc_list = [{"input": t.input, "expected_output": t.expected_output} for t in testcases]

    stdout, stderr = run_python(code, custom_input)
    result = {"console": {"stdout": stdout, "stderr": stderr}}

    if testcases:
        result.update(run_testcases(code, tc_list))

    return result

# =====================================================
# FINAL SUBMIT
# =====================================================
@app.post("/api/student/submit-exam")
def submit_exam(data: dict, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Submission).filter(Submission.user_id == user.id).delete()

    for ans in data["answers"]:

        testcases = db.query(TestCase).filter(TestCase.qno == ans["qno"]).all()
        tc_list = [{"input": t.input, "expected_output": t.expected_output, "marks": t.marks} for t in testcases]

        result = run_testcases(ans["code"], tc_list)

        total_marks = 0
        for i, r in enumerate(result["report"]):
            if r["status"] == "PASS":
                total_marks += tc_list[i]["marks"]

        db.add(Submission(
            user_id=user.id,
            reg_no=user.username,
            student_name=f"{user.first_name} {user.last_name}",
            qno=ans["qno"],
            language=ans["language"],
            code=ans["code"],
            marks=total_marks   # ✅ STORED
        ))

    db.commit()
    return {"status": "submitted"}

# =====================================================
# STAFF RESULTS
# =====================================================
@app.get("/api/staff/results")
def staff_results(db: Session = Depends(get_db)):

    # total possible marks from all testcases
    total_marks = db.query(func.coalesce(func.sum(TestCase.marks), 0)).scalar()

    rows = db.query(
        User.id,
        User.username,
        User.email,
        User.phone,
        User.first_name,
        User.last_name,
        func.coalesce(func.sum(Submission.marks), 0).label("obtained_marks"),
        func.max(Submission.submitted_at).label("submitted_at")
    ).join(Submission).group_by(
        User.id, User.username, User.email,
        User.phone, User.first_name, User.last_name
    ).all()

    return [{
        "id": r.id,
        "reg_no": r.username,
        "student_name": f"{r.first_name} {r.last_name}",
        "email": r.email,
        "phone": r.phone,
        "obtained_marks": int(r.obtained_marks),
        "total_marks": int(total_marks),
        "submitted_at": r.submitted_at
    } for r in rows]

from datetime import datetime, timedelta
from fastapi import Response, HTTPException, Depends
from sqlalchemy.orm import Session

@app.get("/api/staff/download/{submission_id}")
def download_answers(submission_id: int, db: Session = Depends(get_db)):
    subs = db.query(Submission).filter(Submission.id == submission_id).all()
    if not subs:
        raise HTTPException(status_code=404, detail="No submission found")

    user = db.query(User).filter(User.id == user_id).first()
    email = getattr(user, "email", "—")
    phone = getattr(user, "phone", "—")

    questions = db.query(Question).all()
    qmap = {q.qno: q for q in questions}

    base_time = subs[0].submitted_at or datetime.utcnow()
    submit_time = base_time + timedelta(hours=5, minutes=30)
    submit_time_str = submit_time.strftime("%Y-%m-%d %H:%M:%S")

    content = "===== HUMANXCODE AI – OFFICIAL ANSWER SHEET =====\n\n"
    content += f"Reg No : {subs[0].reg_no}\n"
    content += f"Name   : {subs[0].student_name}\n"
    content += f"Email  : {email}\n"
    content += f"Phone  : {phone}\n"
    content += f"Date   : {submit_time_str} IST\n\n"

    for s in subs:
        q = qmap.get(s.qno)
        content += "--------------------------------------------\n"
        content += f"Question {s.qno}: {q.title if q else 'Undefined'}\n"
        content += f"{q.description if q else ''}\n\n"
        content += ">>> Student Code:\n"
        content += f"{s.code or 'No code'}\n\n"
        content += ">>> Output:\nEvaluated by HumanXCode AI Engine\n\n"

    content += "\n=========== AI FINAL REVIEW ===========\nEvaluation completed successfully.\n"

    filename = f"HUMANXCODE_{subs[0].reg_no}_{submit_time.strftime('%Y%m%d_%H%M%S')}.txt"

    return Response(
        content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
# =====================================================
# DELETE SUBMISSION
# =====================================================

@app.delete("/api/staff/result/{user_id}")
def delete_submission(user_id: int, db: Session = Depends(get_db)):
    db.query(Submission).filter(Submission.user_id == user_id).delete()
    db.commit()
    return {"msg": "Deleted successfully"}


# ===============================
# STUDENT - GET TEST CASES (VISIBLE IN EXAM)
# ===============================
@app.get("/api/student/testcases/{qno}")
def get_student_testcases(qno: int, db: Session = Depends(get_db)):
    tcs = db.query(TestCase).filter(TestCase.qno == qno).all()

    return [
        {
            "input": tc.input,
            "expected_output": tc.expected_output
        }
        for tc in tcs
    ]
from models import Staff
from database import SessionLocal

@app.get("/create-staff")
def create_staff():
    db = SessionLocal()

    USERNAME = "admin"
    EMAIL = "admin@humanxcode.com"
    PASSWORD = "admin123"

    old = db.query(Staff).filter(Staff.username == USERNAME).first()
    if old:
        return {"message": "Staff already exists"}

    staff = Staff(
        username=USERNAME,
        email=EMAIL,
        password=hash_password(PASSWORD)
    )

    db.add(staff)
    db.commit()
    db.close()

    return {
        "message": "Staff created successfully",
        "username": USERNAME,
        "password": PASSWORD
    }
