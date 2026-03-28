"""
backend/app/db/database.py

Configuracion de SQLAlchemy.
Soporta SQLite (dev) y PostgreSQL (prod) sin cambiar codigo —
solo cambia DATABASE_URL en .env.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./soberlens.db")

# SQLite necesita check_same_thread=False para funcionar con FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    Dependency de FastAPI. Provee una sesion de DB por request
    y la cierra al terminar.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Crea todas las tablas si no existen. Se llama en startup."""
    Base.metadata.create_all(bind=engine)
