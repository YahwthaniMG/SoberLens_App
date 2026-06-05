"""
backend/app/routes/employees.py

POST /employees/join        — empleado ingresa access_code, retorna datos de la empresa
POST /employees/verify-id   — empleado ingresa worker_id, retorna su nombre para confirmar
POST /employees/register    — registra face_embedding vinculado al employee_id
GET  /employees/me          — datos del empleado autenticado por X-Device-ID
"""

import logging

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Company, Employee
from app.services.identity import IdentityService, get_identity_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/employees")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _decode_frame(upload: UploadFile) -> np.ndarray:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no soportado: {upload.content_type}.",
        )
    raw = upload.file.read()
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen.")
    return img


def _get_employee_by_device(device_id: str, db: Session) -> Employee:
    employee = db.query(Employee).filter(Employee.device_id == device_id).first()
    if employee is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado.")
    return employee


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class JoinRequest(BaseModel):
    access_code: str


class VerifyIdRequest(BaseModel):
    worker_id: str
    company_id: int
    access_point: bool = False


# ---------------------------------------------------------------------------
# POST /employees/join
# ---------------------------------------------------------------------------


@router.post("/join")
def join_company(body: JoinRequest, db: Session = Depends(get_db)):
    """
    El empleado ingresa el codigo de empresa.
    Retorna el nombre de la empresa para que el empleado confirme antes de continuar.
    """
    code = body.access_code.strip().upper()
    company = db.query(Company).filter(Company.access_code == code).first()
    if company is None:
        raise HTTPException(status_code=404, detail="Codigo de empresa no valido.")

    return {
        "company_id": company.id,
        "company_name": company.name,
        "industry": company.industry,
    }


# ---------------------------------------------------------------------------
# POST /employees/verify-id
# ---------------------------------------------------------------------------


@router.post("/verify-id")
def verify_worker_id(body: VerifyIdRequest, db: Session = Depends(get_db)):
    employee = (
        db.query(Employee)
        .filter(
            Employee.worker_id == body.worker_id.strip(),
            Employee.company_id == body.company_id,
        )
        .first()
    )
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="ID de trabajador no encontrado en esta empresa.",
        )

    # En punto de acceso se permite aunque ya tenga dispositivo registrado
    if not body.access_point and employee.device_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Este ID ya fue registrado en otro dispositivo.",
        )

    return {
        "employee_id": employee.id,
        "name": employee.name,
        "area": employee.area,
        "shift": employee.shift,
    }


# ---------------------------------------------------------------------------
# POST /employees/register
# ---------------------------------------------------------------------------


@router.post("/register")
def register_employee(
    frame: UploadFile = File(..., description="Foto de referencia (JPEG/PNG)"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    x_employee_id: int = Header(..., alias="X-Employee-ID"),
    x_company_id: int = Header(..., alias="X-Company-ID"),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    """
    Registra el embedding facial del empleado y vincula su device_id.
    Requiere que verify-id haya confirmado el employee_id previamente.
    """
    employee = db.query(Employee).filter(Employee.id == x_employee_id).first()
    if employee is None:
        raise HTTPException(status_code=404, detail="Empleado no encontrado.")
    if employee.company_id != x_company_id:
        raise HTTPException(
            status_code=403, detail="El empleado no pertenece a esta empresa."
        )
    if employee.device_id is not None and employee.device_id != x_device_id:
        raise HTTPException(
            status_code=409,
            detail="Este empleado ya esta registrado en otro dispositivo.",
        )

    bgr = _decode_frame(frame)
    embedding = svc.extract_embedding(bgr)
    if embedding is None:
        raise HTTPException(
            status_code=422,
            detail="No se detecto cara en la imagen. Intenta con mejor iluminacion.",
        )

    employee.device_id = x_device_id
    employee.face_embedding = svc.serialize(embedding)
    db.commit()

    logger.info(
        "Empleado registrado: employee_id=%d company_id=%d device_id=%s",
        employee.id,
        employee.company_id,
        x_device_id,
    )

    return {
        "registered": True,
        "employee_id": employee.id,
        "name": employee.name,
        "embedding_size": len(embedding),
    }


# ---------------------------------------------------------------------------
# GET /employees/me
# ---------------------------------------------------------------------------


@router.get("/me")
def get_employee(
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
):
    employee = _get_employee_by_device(x_device_id, db)
    return {
        "employee_id": employee.id,
        "worker_id": employee.worker_id,
        "name": employee.name,
        "area": employee.area,
        "shift": employee.shift,
        "company_id": employee.company_id,
        "status": employee.status,
    }
