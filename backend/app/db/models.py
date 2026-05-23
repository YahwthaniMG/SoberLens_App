"""
backend/app/db/models.py

Tablas de la base de datos.

B2C (legacy, se mantiene por retrocompatibilidad):
  users    — usuario registrado por device_id
  sessions — cada verificacion realizada
  consents — consentimientos del usuario

B2B (nuevo):
  companies  — empresa registrada con access_code unico
  employees  — operadores vinculados a una empresa
  shifts     — ventanas horarias de verificacion por turno
"""

import datetime
import json
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _now() -> datetime.datetime:
    return datetime.datetime.utcnow()


# ---------------------------------------------------------------------------
# users (B2C legacy)
# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(16), nullable=True)
    face_embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
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
# companies (B2B)
# ---------------------------------------------------------------------------


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rfc: Mapped[str | None] = mapped_column(String(13), nullable=True)
    email: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)

    # Codigo de acceso para empleados: formato XXXX-9999
    access_code: Mapped[str] = mapped_column(
        String(9), unique=True, index=True, nullable=False
    )

    # JSON array de hasta 3 numeros: ["+521234567890", ...]
    alert_contacts: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )

    employees: Mapped[list["Employee"]] = relationship(
        "Employee", back_populates="company"
    )
    shifts: Mapped[list["Shift"]] = relationship("Shift", back_populates="company")

    def get_alert_contacts(self) -> list[str]:
        if not self.alert_contacts:
            return []
        return json.loads(self.alert_contacts)

    def set_alert_contacts(self, contacts: list[str]):
        self.alert_contacts = json.dumps(contacts[:3])


# ---------------------------------------------------------------------------
# employees (B2B)
# ---------------------------------------------------------------------------


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=False, index=True
    )

    # ID del trabajador tal como viene en el CSV de la empresa
    worker_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    area: Mapped[str | None] = mapped_column(String(64), nullable=True)
    shift: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Se asigna cuando el empleado completa el registro en su celular
    device_id: Mapped[str | None] = mapped_column(
        String(128), unique=True, nullable=True, index=True
    )
    face_embedding: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(16), default="active", nullable=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )

    company: Mapped["Company"] = relationship("Company", back_populates="employees")
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="employee"
    )


# ---------------------------------------------------------------------------
# shifts (B2B)
# ---------------------------------------------------------------------------


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(64), nullable=False)

    # Ventana de verificacion obligatoria
    verification_start: Mapped[datetime.time | None] = mapped_column(
        Time, nullable=True
    )
    verification_end: Mapped[datetime.time | None] = mapped_column(Time, nullable=True)

    # JSON array de ints: [0,1,2,3,4] donde 0=lunes
    work_days: Mapped[str | None] = mapped_column(Text, nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="shifts")

    def get_work_days(self) -> list[int]:
        if not self.work_days:
            return []
        return json.loads(self.work_days)

    def set_work_days(self, days: list[int]):
        self.work_days = json.dumps(days)


# ---------------------------------------------------------------------------
# sessions (extendido para B2B)
# ---------------------------------------------------------------------------


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # B2C — nullable para retrocompatibilidad
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )

    # B2B — nullable para retrocompatibilidad
    employee_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("employees.id"), nullable=True, index=True
    )
    company_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("companies.id"), nullable=True, index=True
    )

    result: Mapped[str] = mapped_column(String(16), nullable=False)
    drunk_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    total_frames: Mapped[int] = mapped_column(Integer, nullable=False)
    analyzed_frames: Mapped[int] = mapped_column(Integer, nullable=False)
    drunk_votes: Mapped[int] = mapped_column(Integer, nullable=False)
    sober_votes: Mapped[int] = mapped_column(Integer, nullable=False)

    # B2C: confirmacion diferida por el usuario
    user_confirmed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    confirmed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    retraining_candidate: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # B2B: segunda verificacion por el admin
    second_verification_result: Mapped[str | None] = mapped_column(
        String(16), nullable=True
    )
    # valores: null | "confirmed" | "false_positive"
    second_verified_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    access_granted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    employee_absent: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=_now, nullable=False
    )

    user: Mapped["User | None"] = relationship("User", back_populates="sessions")
    employee: Mapped["Employee | None"] = relationship(
        "Employee", back_populates="sessions"
    )


# ---------------------------------------------------------------------------
# consents (B2C legacy)
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
