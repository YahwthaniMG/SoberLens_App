"""
backend/app/routes/notify.py

POST /notify
    Envia alerta WhatsApp (con fallback a SMS) al contacto de emergencia.
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User
from app.services.notifier import send_alert

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notify")


class NotifyRequest(BaseModel):
    session_id: int
    emergency_contact: str | None = None


@router.post("")
def notify(
    body: NotifyRequest,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: DBSession = Depends(get_db),
):
    user = db.query(User).filter(User.device_id == x_device_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == body.session_id, SessionModel.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Sesion no encontrada.")

    contact = body.emergency_contact or user.emergency_contact
    if not contact:
        raise HTTPException(
            status_code=422,
            detail="No hay contacto de emergencia configurado.",
        )

    if body.emergency_contact and not user.emergency_contact:
        user.emergency_contact = body.emergency_contact
        db.commit()

    pct = int(session.drunk_ratio * 100)
    # Mensaje de fallback para SMS
    sms_message = (
        f"Alerta SoberLens: tu contacto puede estar en estado de intoxicacion. "
        f"La verificacion detecto intoxicacion en {pct}% de los frames. "
        f"Por favor comunicate con el/ella."
    )

    result = send_alert(
        to_number=contact,
        message=sms_message,
        contact_name="tu contacto",
        pct=pct,
    )

    logger.info(
        "Alerta enviada: session_id=%d channel=%s sent=%s",
        body.session_id,
        result["channel"],
        result["sent"],
    )

    return {
        "sent": result["sent"],
        "channel": result["channel"],
        "to": contact if result["sent"] else None,
    }
