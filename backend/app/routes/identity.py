"""
backend/app/routes/identity.py

POST /identity/register
    Registra el embedding facial de referencia de un usuario.
    Si el usuario no existe, lo crea. Si ya tiene embedding, lo sobreescribe.

POST /identity/verify
    Verifica que el frame actual corresponde al usuario registrado.
    Compara el embedding del frame con el de referencia via similitud coseno.

Ambos endpoints reciben:
    Header:  X-Device-ID  (UUID generado en el frontend)
    Body:    multipart/form-data con campo "frame" (imagen JPEG/PNG)
"""

import logging
import os

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.services.identity import IdentityService, get_identity_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/identity")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _decode_frame(upload: UploadFile) -> np.ndarray:
    """Decodifica UploadFile a BGR. Lanza HTTPException si falla."""
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
    """Busca el usuario por device_id o lo crea si no existe."""
    user = db.query(User).filter(User.device_id == device_id).first()
    if user is None:
        user = User(device_id=device_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Usuario creado: device_id=%s id=%d", device_id, user.id)
    return user


# ---------------------------------------------------------------------------
# POST /identity/register
# ---------------------------------------------------------------------------


@router.post("/register")
def register(
    frame: UploadFile = File(..., description="Foto de referencia (JPEG/PNG)"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    """
    Extrae el embedding facial del frame y lo guarda como referencia del usuario.
    Usado en la pantalla de Registro Facial (onboarding).
    """
    bgr = _decode_frame(frame)

    embedding = svc.extract_embedding(bgr)
    if embedding is None:
        raise HTTPException(
            status_code=422,
            detail="No se detectó cara en la imagen. Intenta con mejor iluminación.",
        )

    user = _get_or_create_user(x_device_id, db)
    user.face_embedding = svc.serialize(embedding)
    db.commit()

    logger.info("Embedding registrado para user_id=%d", user.id)
    return {
        "registered": True,
        "user_id": user.id,
        "embedding_size": len(embedding),
    }


# ---------------------------------------------------------------------------
# POST /identity/verify
# ---------------------------------------------------------------------------


@router.post("/verify")
def verify(
    frame: UploadFile = File(..., description="Frame actual para verificar identidad"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: Session = Depends(get_db),
    svc: IdentityService = Depends(get_identity_service),
):
    """
    Compara el embedding del frame actual con el de referencia del usuario.
    Usado antes de cada captura para prevenir spoofing.
    """
    user = db.query(User).filter(User.device_id == x_device_id).first()
    if user is None or user.face_embedding is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no registrado. Completa el registro facial primero.",
        )

    bgr = _decode_frame(frame)

    embedding_current = svc.extract_embedding(bgr)
    if embedding_current is None:
        raise HTTPException(
            status_code=422,
            detail="No se detectó cara en la imagen.",
        )

    embedding_reference = svc.deserialize(user.face_embedding)
    similarity = svc.cosine_similarity(embedding_reference, embedding_current)

    threshold = float(os.getenv("EMBEDDING_SIMILARITY_THRESHOLD", 0.75))
    verified = similarity >= threshold

    logger.info(
        "Verificacion user_id=%d similarity=%.4f threshold=%.2f verified=%s",
        user.id,
        similarity,
        threshold,
        verified,
    )

    return {
        "verified": verified,
        "similarity": round(similarity, 4),
        "threshold": threshold,
    }
