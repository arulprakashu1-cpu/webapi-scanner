import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Resolve DB path relative to this file so it works from any working directory
_SRC = Path(__file__).resolve().parent
_ROOT = _SRC.parent.parent.parent.parent  # webapi-scanner/
_DEFAULT_DB = _ROOT / "scanner.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DEFAULT_DB}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from . import models  # noqa: F401 — side-effect import registers all models
    Base.metadata.create_all(bind=engine)
