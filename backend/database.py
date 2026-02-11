from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg2://postgres:2003@localhost:5432/exam_portal"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # ✅ prevents broken connection errors
    pool_size=50,
    max_overflow=50,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
