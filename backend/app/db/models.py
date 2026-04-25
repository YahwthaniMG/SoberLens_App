"""
backend/app/db/models.py

Tablas de la base de datos.

users    — usuario registrado (embedding facial de referencia + contacto)
sessions — cada verificacion realizada (resultado, frames analizados, votos)
consents — consentimientos del usuario (obligatorio y opcional)
"""

import datetime
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _now() -> datetime.datetime:
    return datetime.datetime.utcnow()


# ---------------------------------------------------------------------------
# users
# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Identificador unico del dispositivo o sesion (generado en el frontend)
    device_id: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )

    # Perfil del usuario
    name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Embedding facial de referencia serializado como JSON
    # Ej: "[0.123, -0.456, ...]"  — vector de 478*2 floats
    face_embedding: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Contacto de emergencia para alertas WhatsApp
    emergency_contact: Mapped[str | None] = mapped_column(String(32), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, onupdate=_now, nullable=False
    )

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="user")
    consent: Mapped["Consent | None"] = relationship(
        "Consent", back_populates="user", uselist=False
    )


# ---------------------------------------------------------------------------
# sessions
# ---------------------------------------------------------------------------


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )

    result: Mapped[str] = mapped_column(String(16), nullable=False)
    drunk_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    total_frames: Mapped[int] = mapped_column(Integer, nullable=False)
    analyzed_frames: Mapped[int] = mapped_column(Integer, nullable=False)
    drunk_votes: Mapped[int] = mapped_column(Integer, nullable=False)
    sober_votes: Mapped[int] = mapped_column(Integer, nullable=False)

    user_confirmed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    confirmed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    retraining_candidate: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")


# ---------------------------------------------------------------------------
# consents
# ---------------------------------------------------------------------------


class Consent(Base):
    __tablename__ = "consents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False
    )

    accepted_processing: Mapped[bool] = mapped_column(Boolean, nullable=False)
    accepted_retraining: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    retraining_updated_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="consent")
