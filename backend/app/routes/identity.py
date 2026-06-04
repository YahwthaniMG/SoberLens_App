"""
backend/app/routes/identity.py
"""

import logging
import os
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Employee
from app.services.identity import IdentityService, get_identity_service
from app.models.schemas import ProfileRequest, ContactRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/identity")
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


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


def _get_or_create_user(device_id: str, db: Session) -> User:
    user = db.query(User).filter(User.device_id == device_id).first()
    if user is None:
        user = User(device_id=device_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Usuario creado: device_id=%s id=%d", device_id, user.id)
    return user


@router.post("/register")
def register(
    frame: UploadFile = File(...),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    bgr = _decode_frame(frame)
    embedding = svc.extract_embedding(bgr)
    if embedding is None:
        raise HTTPException(
            status_code=422,
            detail="No se detecto cara en la imagen. Intenta con mejor iluminacion.",
        )
    user = _get_or_create_user(x_device_id, db)
    user.face_embedding = svc.serialize(embedding)
    db.commit()
    logger.info("Embedding registrado para user_id=%d", user.id)
    return {"registered": True, "user_id": user.id, "embedding_size": len(embedding)}


@router.post("/verify")
def verify(
    frame: UploadFile = File(...),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    x_employee_id: Optional[int] = Header(None, alias="X-Employee-ID"),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    """
    Verifica identidad. En B2B busca el embedding en Employee,
    en B2C busca en User.
    """
    threshold = float(os.getenv("EMBEDDING_SIMILARITY_THRESHOLD", 0.75))
    reference_embedding = None

    # B2B — buscar en empleado
    if x_employee_id is not None:
        employee = db.query(Employee).filter(Employee.id == x_employee_id).first()
        if employee and employee.face_embedding:
            reference_embedding = svc.deserialize(employee.face_embedding)

    # B2C — buscar en usuario
    if reference_embedding is None:
        user = db.query(User).filter(User.device_id == x_device_id).first()
        if user and user.face_embedding:
            reference_embedding = svc.deserialize(user.face_embedding)

    if reference_embedding is None:
        raise HTTPException(
            status_code=404,
            detail="No hay embedding registrado. Completa el registro facial primero.",
        )

    bgr = _decode_frame(frame)
    embedding_current = svc.extract_embedding(bgr)
    if embedding_current is None:
        raise HTTPException(status_code=422, detail="No se detecto cara en la imagen.")

    similarity = svc.cosine_similarity(reference_embedding, embedding_current)
    verified = similarity >= threshold

    logger.info(
        "Verificacion employee_id=%s similarity=%.4f verified=%s",
        x_employee_id,
        similarity,
        verified,
    )

    return {
        "verified": verified,
        "similarity": round(similarity, 4),
        "threshold": threshold,
    }


@router.patch("/profile")
def update_profile(
    body: ProfileRequest,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
):
    user = _get_or_create_user(x_device_id, db)
    user.name = body.name.strip()
    user.age_range = body.age_range
    if body.emergency_contact is not None:
        user.emergency_contact = body.emergency_contact.strip()
    if body.emergency_contact_name is not None:
        user.emergency_contact_name = body.emergency_contact_name.strip()
    db.commit()
    return {
        "updated": True,
        "name": user.name,
        "age_range": user.age_range,
        "emergency_contact": user.emergency_contact,
        "emergency_contact_name": user.emergency_contact_name,
    }


@router.patch("/contact")
def update_contact(
    body: ContactRequest,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
):
    user = _get_or_create_user(x_device_id, db)
    user.emergency_contact = body.emergency_contact.strip()
    if body.emergency_contact_name is not None:
        user.emergency_contact_name = body.emergency_contact_name.strip()
    db.commit()
    return {
        "updated": True,
        "emergency_contact": user.emergency_contact,
        "emergency_contact_name": user.emergency_contact_name,
    }


@router.post("/recover")
def recover(
    frame: UploadFile = File(...),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    bgr = _decode_frame(frame)
    embedding_current = svc.extract_embedding(bgr)
    if embedding_current is None:
        raise HTTPException(
            status_code=422,
            detail="No se detecto cara en la imagen. Intenta con mejor iluminacion.",
        )

    threshold = float(os.getenv("EMBEDDING_SIMILARITY_THRESHOLD", 0.75))
    users_with_embedding = db.query(User).filter(User.face_embedding.isnot(None)).all()

    best_user = None
    best_similarity = 0.0

    for candidate in users_with_embedding:
        embedding_ref = svc.deserialize(candidate.face_embedding)
        similarity = svc.cosine_similarity(embedding_ref, embedding_current)
        if similarity > best_similarity:
            best_similarity = similarity
            best_user = candidate

    if best_user is None or best_similarity < threshold:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "user_not_found",
                "message": "No se encontro ningun usuario registrado con ese rostro.",
                "best_similarity": round(best_similarity, 4),
            },
        )

    return {
        "found": True,
        "device_id": best_user.device_id,
        "name": best_user.name,
        "similarity": round(best_similarity, 4),
    }
