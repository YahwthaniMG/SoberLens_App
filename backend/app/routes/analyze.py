"""
backend/app/routes/analyze.py

POST /analyze
Recibe hasta 18 frames como archivos multipart, los clasifica y retorna
el resultado de la sesion con votacion por mayoria.

Contrato del request:
    Content-Type: multipart/form-data
    Header:  X-Device-ID (UUID del frontend)
    Campo:   frames  (List[UploadFile], JPEG o PNG)

Contrato del response (200 OK):
    AnalyzeResponse (ver schemas.py)

Errores posibles:
    400 - No se enviaron frames / formato invalido
    422 - Validacion de Pydantic (automatico)
    500 - Error interno al procesar
"""

import logging

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User
from app.models.schemas import AnalyzeResponse, FrameResult
from app.services.predictor import Predictor, get_predictor

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FRAMES = 18
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _decode_upload(upload: UploadFile) -> np.ndarray | None:
    raw = upload.file.read()
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def _get_or_create_user(device_id: str, db: DBSession) -> User:
    user = db.query(User).filter(User.device_id == device_id).first()
    if user is None:
        user = User(device_id=device_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    frames: list[UploadFile] = File(..., description="Frames capturados (JPEG/PNG)"),
    x_device_id: str = Header(..., alias="X-Device-ID"),
    predictor: Predictor = Depends(get_predictor),
    db: DBSession = Depends(get_db),
):
    # ------------------------------------------------------------------
    # Validacion de entrada
    # ------------------------------------------------------------------
    if not frames:
        raise HTTPException(status_code=400, detail="Se requiere al menos un frame.")

    if len(frames) > MAX_FRAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Se aceptan maximo {MAX_FRAMES} frames por sesion.",
        )

    for upload in frames:
        if upload.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no soportado: {upload.content_type}. "
                f"Usar JPEG, PNG o WebP.",
            )

    # ------------------------------------------------------------------
    # Decodificacion en memoria (nunca se escribe a disco)
    # ------------------------------------------------------------------
    bgr_frames = []
    for i, upload in enumerate(frames):
        img = _decode_upload(upload)
        if img is None:
            logger.warning("Frame %d no pudo decodificarse — se omite.", i)
            continue
        bgr_frames.append(img)

    if not bgr_frames:
        raise HTTPException(
            status_code=400,
            detail="Ninguno de los frames pudo decodificarse como imagen valida.",
        )

    # ------------------------------------------------------------------
    # Inferencia
    # ------------------------------------------------------------------
    try:
        session_result = predictor.predict_session(bgr_frames)
    except Exception as exc:
        logger.exception("Error durante la inferencia.")
        raise HTTPException(
            status_code=500, detail="Error interno al analizar los frames."
        ) from exc

    # ------------------------------------------------------------------
    # Persistencia — guardar sesion en DB
    # ------------------------------------------------------------------
    user = _get_or_create_user(x_device_id, db)

    db_session = SessionModel(
        user_id=user.id,
        result=session_result["result"],
        drunk_ratio=session_result["drunk_ratio"],
        total_frames=session_result["total_frames"],
        analyzed_frames=session_result["analyzed_frames"],
        drunk_votes=session_result["drunk_votes"],
        sober_votes=session_result["sober_votes"],
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    logger.info(
        "Sesion guardada: id=%d user_id=%d result=%s drunk_ratio=%.2f",
        db_session.id,
        user.id,
        db_session.result,
        db_session.drunk_ratio,
    )

    # ------------------------------------------------------------------
    # Respuesta
    # ------------------------------------------------------------------
    frame_results = [FrameResult(**r) for r in session_result["frame_results"]]

    return AnalyzeResponse(
        total_frames=session_result["total_frames"],
        analyzed_frames=session_result["analyzed_frames"],
        drunk_votes=session_result["drunk_votes"],
        sober_votes=session_result["sober_votes"],
        drunk_ratio=session_result["drunk_ratio"],
        result=session_result["result"],
        frame_results=frame_results,
    )
