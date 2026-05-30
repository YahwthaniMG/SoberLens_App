"""
backend/app/routes/sessions.py
"""

import datetime
import logging
from app.db.models import Session as SessionModel, User, Employee

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User
from app.services.auth import get_current_company
from app.db.models import Company

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions")

CONFIRM_DELAY_HOURS = 24


def _get_user_or_employee(device_id: str, db: DBSession):
    """
    Retorna (user_id, employee_id) segun quien este registrado con ese device_id.
    Primero busca en employees (B2B), luego en users (B2C).
    """
    employee = db.query(Employee).filter(Employee.device_id == device_id).first()
    if employee:
        return None, employee.id

    user = db.query(User).filter(User.device_id == device_id).first()
    if user:
        return user.id, None

    raise HTTPException(status_code=404, detail="Usuario no encontrado.")


def _session_dict(s: SessionModel) -> dict:
    now = datetime.datetime.utcnow()
    confirmable_at = s.created_at + datetime.timedelta(hours=CONFIRM_DELAY_HOURS)
    remaining = max((confirmable_at - now).total_seconds(), 0)
    return {
        "id": s.id,
        "result": s.result,
        "drunk_ratio": s.drunk_ratio,
        "total_frames": s.total_frames,
        "analyzed_frames": s.analyzed_frames,
        "drunk_votes": s.drunk_votes,
        "sober_votes": s.sober_votes,
        "user_confirmed": s.user_confirmed,
        "created_at": s.created_at.isoformat(),
        "confirmable_at": confirmable_at.isoformat(),
        "hours_until_confirmable": round(remaining / 3600, 1),
        "is_confirmable": remaining == 0 and s.user_confirmed is None,
    }


@router.patch("/{session_id}/confirm")
def confirm_session(
    session_id: int,
    correct: bool,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: DBSession = Depends(get_db),
):
    user_id, employee_id = _get_user_or_employee(x_device_id, db)

    query = db.query(SessionModel).filter(SessionModel.id == session_id)
    if employee_id:
        query = query.filter(SessionModel.employee_id == employee_id)
    else:
        query = query.filter(SessionModel.user_id == user_id)

    session = query.first()
    if session is None:
        raise HTTPException(status_code=404, detail="Sesion no encontrada.")

    if session.user_confirmed is not None:
        raise HTTPException(status_code=409, detail="Esta sesion ya fue confirmada.")

    now = datetime.datetime.utcnow()
    confirmable_at = session.created_at + datetime.timedelta(hours=CONFIRM_DELAY_HOURS)
    if now < confirmable_at:
        raise HTTPException(status_code=425, detail="Aun no han pasado 24 horas.")

    session.user_confirmed = correct
    session.confirmed_at = now
    if correct and session.drunk_ratio >= 0.80:
        session.retraining_candidate = True
    db.commit()

    return {"confirmed": True, "session_id": session.id}


# ---------------------------------------------------------------------------
# PATCH /sessions/{session_id}/second-verify
# ---------------------------------------------------------------------------


@router.patch("/{session_id}/second-verify")
def second_verify(
    session_id: int,
    result: str,
    company: Company = Depends(get_current_company),
    db: DBSession = Depends(get_db),
):
    """
    El admin confirma o descarta un resultado no apto.
    result debe ser "confirmed" o "false_positive".
    Solo el admin de la empresa duena de la sesion puede llamar este endpoint.
    """
    if result not in ("confirmed", "false_positive"):
        raise HTTPException(
            status_code=400,
            detail="El valor de result debe ser 'confirmed' o 'false_positive'.",
        )

    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == session_id,
            SessionModel.company_id == company.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Sesion no encontrada.")

    if session.second_verification_result is not None:
        raise HTTPException(
            status_code=409,
            detail="Esta sesion ya tiene segunda verificacion registrada.",
        )

    session.second_verification_result = result
    session.second_verified_at = datetime.datetime.utcnow()
    session.access_granted = result == "false_positive"
    db.commit()

    logger.info(
        "Segunda verificacion: session_id=%d result=%s access_granted=%s company_id=%d",
        session_id,
        result,
        session.access_granted,
        company.id,
    )

    return {
        "session_id": session.id,
        "second_verification_result": session.second_verification_result,
        "access_granted": session.access_granted,
        "second_verified_at": session.second_verified_at.isoformat(),
    }
