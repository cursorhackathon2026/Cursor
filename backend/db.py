"""SQLite baza ulanishi."""
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session
import re

DB_PATH = Path(__file__).parent / "perinatal.db"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def init_db():
    import models  # noqa: F401 — jadvallar ro'yxatga olinishi uchun
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    return Session(engine)


def norm_phone(p: str) -> str:
    d = re.sub(r"\D", "", p or "")
    return d[-9:] if len(d) >= 9 else d
