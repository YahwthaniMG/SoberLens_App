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
    400  - No se enviaron frames / formato invalido
    409  - Validacion de identidad fallida (no_face / identity_mismatch)
    422  - Validacion de Pydantic (automatico)
    500  - Error interno al procesar

Validacion de identidad durante la sesion:
    Si el usuario tiene embedding registrado, cada frame pasa por
    IdentityService.identify_user_face() antes de la clasificacion.

    Umbrales de rechazo de sesion:
        NO_FACE_THRESHOLD    = 0.40  (>40% de frames sin cara → error)
        MISMATCH_THRESHOLD   = 0.30  (>30% de frames con cara incorrecta → error)

    Si no hay embedding registrado, los frames se clasifican sin verificacion
    de identidad (identity_status="unknown").
"""

import logging
import os

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User
from app.models.schemas import AnalyzeResponse, FrameResult
from app.services.identity import IdentityService, get_identity_service
from app.services.predictor import Predictor, get_predictor

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FRAMES = 18
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Fraccion maxima de frames sin cara antes de rechazar la sesion
NO_FACE_THRESHOLD = 0.40
# Fraccion maxima de frames con cara incorrecta antes de rechazar la sesion
MISMATCH_THRESHOLD = 0.30


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
    identity_svc: IdentityService = Depends(get_identity_service),
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
                "Usar JPEG, PNG o WebP.",
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
    # Cargar embedding de referencia del usuario (puede ser None)
    # ------------------------------------------------------------------
    user = _get_or_create_user(x_device_id, db)
    reference_embedding = None
    if user.face_embedding:
        reference_embedding = identity_svc.deserialize(user.face_embedding)

    identity_threshold = float(os.getenv("EMBEDDING_SIMILARITY_THRESHOLD", 0.75))

    # ------------------------------------------------------------------
    # Validacion de identidad por frame
    # ------------------------------------------------------------------
    # Estructura por frame: {"status": str, "similarity": float|None, "frame_index": int}
    frame_identity = []

    for frame in bgr_frames:
        if reference_embedding is None:
            # Usuario sin embedding registrado — no se verifica identidad
            frame_identity.append({"status": "unknown", "similarity": None})
        else:
            result = identity_svc.identify_user_face(
                frame, reference_embedding, identity_threshold
            )
            frame_identity.append(
                {"status": result["status"], "similarity": result["similarity"]}
            )

    # ------------------------------------------------------------------
    # Evaluacion de umbrales de sesion (solo si hay embedding)
    # ------------------------------------------------------------------
    total = len(bgr_frames)

    if reference_embedding is not None:
        no_face_count = sum(1 for fi in frame_identity if fi["status"] == "no_face")
        wrong_person_count = sum(
            1 for fi in frame_identity if fi["status"] == "wrong_person"
        )
        frames_with_face = total - no_face_count

        no_face_ratio = no_face_count / total
        mismatch_ratio = (
            wrong_person_count / frames_with_face if frames_with_face > 0 else 0.0
        )

        logger.info(
            "Validacion identidad: total=%d sin_cara=%d (%.0f%%) persona_incorrecta=%d (%.0f%% de frames con cara)",
            total,
            no_face_count,
            no_face_ratio * 100,
            wrong_person_count,
            mismatch_ratio * 100,
        )

        if no_face_ratio > NO_FACE_THRESHOLD:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "insufficient_face_coverage",
                    "message": "No se detecto tu cara en suficientes frames. "
                    "Asegurate de estar frente a la camara durante toda la grabacion.",
                    "no_face_frames": no_face_count,
                    "total_frames": total,
                },
            )

        if mismatch_ratio > MISMATCH_THRESHOLD:
            raise HTTPException(
                status_code=409,
                detail={
                    "error": "identity_mismatch",
                    "message": "Se detecto una persona diferente en varios frames. "
                    "Asegurate de que solo tu estes frente a la camara.",
                    "wrong_person_frames": wrong_person_count,
                    "frames_with_face": frames_with_face,
                },
            )

    # ------------------------------------------------------------------
    # Clasificacion: solo frames con cara verificada (o unknown si no hay embedding)
    # ------------------------------------------------------------------
    valid_statuses = {"verified", "unknown"}
    frames_to_classify = [
        bgr_frames[i]
        for i, fi in enumerate(frame_identity)
        if fi["status"] in valid_statuses
    ]

    if not frames_to_classify:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "insufficient_face_coverage",
                "message": "No quedaron frames validos para clasificar tras la verificacion de identidad.",
                "no_face_frames": total,
                "total_frames": total,
            },
        )

    # ------------------------------------------------------------------
    # Inferencia
    # ------------------------------------------------------------------
    try:
        session_result = predictor.predict_session(frames_to_classify)
    except Exception as exc:
        logger.exception("Error durante la inferencia.")
        raise HTTPException(
            status_code=500, detail="Error interno al analizar los frames."
        ) from exc

    # ------------------------------------------------------------------
    # Persistencia — guardar sesion en DB
    # ------------------------------------------------------------------
    db_session = SessionModel(
        user_id=user.id,
        result=session_result["result"],
        drunk_ratio=session_result["drunk_ratio"],
        total_frames=total,
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
    # Ensamblar frame_results con identity_status incluido
    # ------------------------------------------------------------------
    # frame_identity tiene una entrada por cada frame decodificado.
    # session_result["frame_results"] tiene una entrada por cada frame clasificado.
    # Hay que combinarlos: los frames no clasificados (wrong_person / no_face)
    # se incluyen en la respuesta con face_detected=False y sin clasificacion.

    classify_iter = iter(session_result["frame_results"])
    frame_results = []

    for fi in frame_identity:
        if fi["status"] in valid_statuses:
            clf = next(classify_iter)
            frame_results.append(
                FrameResult(
                    face_detected=clf["face_detected"],
                    identity_status=fi["status"],
                    identity_similarity=fi["similarity"],
                    drunk_probability=clf["drunk_probability"],
                    prediction=clf["prediction"],
                )
            )
        else:
            # Frame descartado por falta de cara o persona incorrecta
            frame_results.append(
                FrameResult(
                    face_detected=(fi["status"] == "wrong_person"),
                    identity_status=fi["status"],
                    identity_similarity=fi["similarity"],
                    drunk_probability=None,
                    prediction=None,
                )
            )

    # Resumen de identidad para la respuesta
    no_face_count_resp = sum(1 for fi in frame_identity if fi["status"] == "no_face")
    wrong_person_count_resp = sum(
        1 for fi in frame_identity if fi["status"] == "wrong_person"
    )
    verified_count_resp = sum(1 for fi in frame_identity if fi["status"] == "verified")

    return AnalyzeResponse(
        total_frames=total,
        analyzed_frames=session_result["analyzed_frames"],
        drunk_votes=session_result["drunk_votes"],
        sober_votes=session_result["sober_votes"],
        drunk_ratio=session_result["drunk_ratio"],
        result=session_result["result"],
        frame_results=frame_results,
        session_id=db_session.id,
        no_face_frames=no_face_count_resp,
        wrong_person_frames=wrong_person_count_resp,
        verified_frames=verified_count_resp,
    )
