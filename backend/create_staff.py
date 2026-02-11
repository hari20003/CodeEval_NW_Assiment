from database import SessionLocal
from models import Staff
from main import hash_password

db = SessionLocal()

# change these if you want
USERNAME = "admin"
EMAIL = "admin@humanxcode.com"
PASSWORD = "admin123"

# check already exists
old = db.query(Staff).filter(Staff.username == USERNAME).first()
if old:
    print("⚠️ Staff already exists")
    exit()

staff = Staff(
    username=USERNAME,
    email=EMAIL,
    password=hash_password(PASSWORD)
)

db.add(staff)
db.commit()

print("✅ Staff created successfully")
print("Username:", USERNAME)
print("Password:", PASSWORD)
