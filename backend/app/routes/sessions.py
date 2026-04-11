"""
backend/app/routes/sessions.py

GET  /sessions
    Retorna el historial de sesiones del usuario ordenado por fecha descendente.

PATCH /sessions/{session_id}/confirm
    Registra la confirmacion diferida del usuario sobre el resultado de una sesion.
    Usado en la pantalla DeferredConfirm (pantalla 08).

Ambos endpoints reciben:
    Header: X-Device-ID (UUID generado en el frontend)
"""

import datetime
import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions")


def _get_user(device_id: str, db: DBSession) -> User:
    user = db.query(User).filter(User.device_id == device_id).first()
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado.",
        )
    return user


# ---------------------------------------------------------------------------
# GET /sessions
# ---------------------------------------------------------------------------


@router.get("")
def get_sessions(
    x_device_id: str = Header(..., alias="X-Device-ID"),
    limit: int = 20,
    offset: int = 0,
    db: DBSession = Depends(get_db),
):
    """
    Retorna el historial de sesiones del usuario.
    Parametros opcionales: limit (default 20) y offset (default 0) para paginacion.
    """
    user = _get_user(x_device_id, db)

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user.id)
        .order_by(SessionModel.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    total = db.query(SessionModel).filter(SessionModel.user_id == user.id).count()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "sessions": [
            {
                "id": s.id,
                "result": s.result,
                "drunk_ratio": s.drunk_ratio,
                "total_frames": s.total_frames,
                "analyzed_frames": s.analyzed_frames,
                "drunk_votes": s.drunk_votes,
                "sober_votes": s.sober_votes,
                "user_confirmed": s.user_confirmed,
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions
        ],
    }


# ---------------------------------------------------------------------------
# PATCH /sessions/{session_id}/confirm
# ---------------------------------------------------------------------------


@router.patch("/{session_id}/confirm")
def confirm_session(
    session_id: int,
    correct: bool,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: DBSession = Depends(get_db),
):
    """
    Registra si el usuario considera que el resultado de la sesion fue correcto.
    Actualiza retraining_candidate si aplica:
    - Solo sesiones con drunk_ratio >= 0.80 y correct=True califican.

    Parametros:
        session_id: ID de la sesion a confirmar
        correct:    true si el resultado fue correcto, false si no
    """
    user = _get_user(x_device_id, db)

    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Sesion no encontrada.")

    if session.user_confirmed is not None:
        raise HTTPException(status_code=409, detail="Esta sesion ya fue confirmada.")

    session.user_confirmed = correct
    session.confirmed_at = datetime.datetime.utcnow()

    # Candidata a re-entrenamiento: resultado de alta confianza y confirmado correcto
    RETRAINING_RATIO_THRESHOLD = 0.80
    session.retraining_candidate = (
        correct and session.drunk_ratio >= RETRAINING_RATIO_THRESHOLD
    )

    db.commit()

    logger.info(
        "Sesion %d confirmada: correct=%s retraining_candidate=%s",
        session_id,
        correct,
        session.retraining_candidate,
    )

    return {
        "session_id": session_id,
        "user_confirmed": session.user_confirmed,
        "retraining_candidate": session.retraining_candidate,
    }
