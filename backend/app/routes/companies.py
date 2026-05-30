"""
backend/app/routes/companies.py

POST /companies/register  — crea empresa, genera access_code, retorna JWT
POST /companies/login     — email + password -> JWT
GET  /companies/me        — datos de la empresa autenticada
PATCH /companies/settings — actualiza alert_contacts
"""

import csv
import io
import logging
import random
import string

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Company, Employee
from app.services.auth import (
    create_access_token,
    get_current_company,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/companies")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CompanyRegisterRequest(BaseModel):
    name: str
    industry: str | None = None
    rfc: str | None = None
    email: str
    password: str


class CompanyLoginRequest(BaseModel):
    email: str
    password: str


class CompanySettingsRequest(BaseModel):
    alert_contacts: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _generate_access_code(db: Session) -> str:
    """
    Genera un codigo unico con formato XXXX-9999.
    Reintenta hasta encontrar uno que no exista en la DB.
    """
    for _ in range(10):
        letters = "".join(random.choices(string.ascii_uppercase, k=4))
        digits = "".join(random.choices(string.digits, k=4))
        code = f"{letters}-{digits}"
        exists = db.query(Company).filter(Company.access_code == code).first()
        if not exists:
            return code
    raise RuntimeError("No se pudo generar un access_code unico.")


# ---------------------------------------------------------------------------
# POST /companies/register
# ---------------------------------------------------------------------------


@router.post("/register", status_code=201)
def register_company(body: CompanyRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Company).filter(Company.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=409, detail="Ya existe una empresa con ese email."
        )

    access_code = _generate_access_code(db)
    company = Company(
        name=body.name.strip(),
        industry=body.industry,
        rfc=body.rfc,
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
        access_code=access_code,
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    token = create_access_token(company.id)
    logger.info(
        "Empresa registrada: id=%d email=%s code=%s",
        company.id,
        company.email,
        access_code,
    )

    return {
        "token": token,
        "company_id": company.id,
        "name": company.name,
        "access_code": access_code,
    }


# ---------------------------------------------------------------------------
# POST /companies/login
# ---------------------------------------------------------------------------


@router.post("/login")
def login_company(body: CompanyLoginRequest, db: Session = Depends(get_db)):
    company = (
        db.query(Company).filter(Company.email == body.email.strip().lower()).first()
    )
    if company is None or not verify_password(body.password, company.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    token = create_access_token(company.id)
    logger.info("Login exitoso: company_id=%d", company.id)

    return {
        "token": token,
        "company_id": company.id,
        "name": company.name,
        "access_code": company.access_code,
    }


# ---------------------------------------------------------------------------
# GET /companies/me
# ---------------------------------------------------------------------------


@router.get("/me")
def get_company(company: Company = Depends(get_current_company)):
    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "rfc": company.rfc,
        "email": company.email,
        "access_code": company.access_code,
        "alert_contacts": company.get_alert_contacts(),
        "created_at": company.created_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# PATCH /companies/settings
# ---------------------------------------------------------------------------


@router.patch("/settings")
def update_settings(
    body: CompanySettingsRequest,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    if len(body.alert_contacts) > 3:
        raise HTTPException(status_code=400, detail="Maximo 3 contactos de alerta.")
    company.set_alert_contacts(body.alert_contacts)
    db.commit()
    logger.info("Contactos actualizados: company_id=%d", company.id)
    return {"updated": True, "alert_contacts": company.get_alert_contacts()}


# ---------------------------------------------------------------------------
# POST /companies/employees/upload
# ---------------------------------------------------------------------------


@router.post("/employees/upload", status_code=201)
def upload_employees(
    file: UploadFile = File(
        ..., description="CSV con columnas: worker_id, name, area, shift"
    ),
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """
    Carga masiva de empleados desde CSV.
    Columnas requeridas: worker_id, name, area, shift
    Si el worker_id ya existe para esa empresa, actualiza name/area/shift.
    """
    if file.content_type not in {"text/csv", "application/vnd.ms-excel", "text/plain"}:
        raise HTTPException(status_code=400, detail="El archivo debe ser CSV.")

    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    required_columns = {"worker_id", "name", "area", "shift"}
    fieldnames_clean = [f.strip() for f in (reader.fieldnames or [])]
    if not required_columns.issubset(set(fieldnames_clean)):
        raise HTTPException(
            status_code=422,
            detail=f"El CSV debe tener las columnas: {', '.join(required_columns)}",
        )

    created = 0
    updated = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        row = {k.strip(): v.strip() for k, v in row.items() if k}
        worker_id = row.get("worker_id", "").strip()
        name = row.get("name", "").strip()
        if not worker_id or not name:
            errors.append(f"Fila {i}: worker_id y name son obligatorios.")
            continue

        existing = (
            db.query(Employee)
            .filter(Employee.worker_id == worker_id, Employee.company_id == company.id)
            .first()
        )
        if existing:
            existing.name = name
            existing.area = row.get("area", "").strip() or existing.area
            existing.shift = row.get("shift", "").strip() or existing.shift
            updated += 1
        else:
            employee = Employee(
                company_id=company.id,
                worker_id=worker_id,
                name=name,
                area=row.get("area", "").strip() or None,
                shift=row.get("shift", "").strip() or None,
            )
            db.add(employee)
            created += 1

    db.commit()
    logger.info(
        "CSV procesado: company_id=%d created=%d updated=%d errors=%d",
        company.id,
        created,
        updated,
        len(errors),
    )

    return {
        "created": created,
        "updated": updated,
        "errors": errors,
    }


# ---------------------------------------------------------------------------
# GET /companies/dashboard
# ---------------------------------------------------------------------------


@router.get("/dashboard")
def get_dashboard(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """
    Resumen del turno actual: empleados activos, verificados hoy,
    con alerta (resultado drunk/caution sin segunda verificacion) y ausentes.
    """
    import datetime
    from app.db.models import Session as SessionModel

    today_start = datetime.datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    active_employees = (
        db.query(Employee)
        .filter(Employee.company_id == company.id, Employee.status == "active")
        .all()
    )

    employee_ids = [e.id for e in active_employees]

    sessions_today = (
        db.query(SessionModel)
        .filter(
            SessionModel.company_id == company.id,
            SessionModel.created_at >= today_start,
        )
        .all()
    )

    verified_today = {s.employee_id for s in sessions_today if s.employee_id}
    alerts = [
        s
        for s in sessions_today
        if s.result in ("drunk", "caution") and s.second_verification_result is None
    ]
    absent_today = {s.employee_id for s in sessions_today if s.employee_absent}

    pending_verification = [
        eid
        for eid in employee_ids
        if eid not in verified_today and eid not in absent_today
    ]

    alert_details = []
    for s in alerts:
        emp = next((e for e in active_employees if e.id == s.employee_id), None)
        if emp:
            alert_details.append(
                {
                    "session_id": s.id,
                    "employee_id": emp.id,
                    "name": emp.name,
                    "area": emp.area,
                    "shift": emp.shift,
                    "result": s.result,
                    "drunk_ratio": s.drunk_ratio,
                    "created_at": s.created_at.isoformat(),
                }
            )

    return {
        "total_active": len(active_employees),
        "verified_today": len(verified_today),
        "pending_verification": len(pending_verification),
        "alerts": alert_details,
        "absent_today": len(absent_today),
    }


# ---------------------------------------------------------------------------
# GET /companies/employees/{employee_id}/history
# ---------------------------------------------------------------------------


@router.get("/employees/{employee_id}/history")
def get_employee_history(
    employee_id: int,
    limit: int = 30,
    offset: int = 0,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db),
):
    """
    Historial de sesiones de un empleado especifico.
    Solo el admin de la empresa a la que pertenece el empleado puede consultarlo.
    """
    from app.db.models import Session as SessionModel

    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id, Employee.company_id == company.id)
        .first()
    )
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Empleado no encontrado en esta empresa.",
        )

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.employee_id == employee_id)
        .order_by(SessionModel.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    total = (
        db.query(SessionModel).filter(SessionModel.employee_id == employee_id).count()
    )

    def _session_dict(s):
        return {
            "id": s.id,
            "result": s.result,
            "drunk_ratio": s.drunk_ratio,
            "access_granted": s.access_granted,
            "second_verification_result": s.second_verification_result,
            "second_verified_at": (
                s.second_verified_at.isoformat() if s.second_verified_at else None
            ),
            "employee_absent": s.employee_absent,
            "created_at": s.created_at.isoformat(),
        }

    return {
        "employee_id": employee.id,
        "name": employee.name,
        "area": employee.area,
        "shift": employee.shift,
        "total": total,
        "limit": limit,
        "offset": offset,
        "sessions": [_session_dict(s) for s in sessions],
    }
