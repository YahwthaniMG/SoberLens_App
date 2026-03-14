"""
backend/app/routes/analyze.py

POST /analyze
Recibe hasta 18 frames como archivos multipart, los clasifica y retorna
el resultado de la sesion con votacion por mayoria.

Contrato del request:
    Content-Type: multipart/form-data
    Campo: frames  (List[UploadFile], JPEG o PNG)

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
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.models.schemas import AnalyzeResponse, FrameResult
from app.services.predictor import Predictor, get_predictor

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FRAMES = 18
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _decode_upload(upload: UploadFile) -> np.ndarray | None:
    """
    Decodifica un UploadFile a imagen BGR (numpy array).
    Retorna None si el contenido no es una imagen valida.
    Los bytes no se escriben a disco — se procesan en memoria.
    """
    raw = upload.file.read()
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img  # None si falla imdecode


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    frames: list[UploadFile] = File(..., description="Frames capturados (JPEG/PNG)"),
    predictor: Predictor = Depends(get_predictor),
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
