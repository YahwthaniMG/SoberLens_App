"""
backend/app/routes/notify.py

POST /notify
    Envia una alerta WhatsApp al contacto de emergencia del usuario.
    Se llama desde el frontend despues de una sesion con resultado "drunk".

Request:
    Header: X-Device-ID
    Body JSON:
        {
            "session_id": int,
            "emergency_contact": str   (opcional — si no se manda usa el guardado en DB)
        }

Response:
    {
        "sent": bool,
        "to": str | null
    }
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Session as SessionModel, User
from app.services.notifier import send_whatsapp_alert

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notify")


class NotifyRequest(BaseModel):
    session_id: int
    emergency_contact: str | None = None


def _build_message(session: SessionModel) -> str:
    pct = int(session.drunk_ratio * 100)
    return (
        f"Alerta SoberLens: tu contacto puede estar en estado de intoxicacion. "
        f"La verificacion detecto intoxicacion en {pct}% de los frames analizados. "
        f"Por favor comunicate con el/ella."
    )


@router.post("")
def notify(
    body: NotifyRequest,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: DBSession = Depends(get_db),
):
    # Verificar que el usuario existe
    user = db.query(User).filter(User.device_id == x_device_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Verificar que la sesion pertenece al usuario
    session = (
        db.query(SessionModel)
        .filter(SessionModel.id == body.session_id, SessionModel.user_id == user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Sesion no encontrada.")

    # Determinar numero de contacto: prioridad al enviado en el body
    contact = body.emergency_contact or user.emergency_contact
    if not contact:
        raise HTTPException(
            status_code=422,
            detail="No hay contacto de emergencia configurado. "
            "Registra uno en el perfil o envialo en el body.",
        )

    # Guardar contacto en el usuario si no tenia uno
    if body.emergency_contact and not user.emergency_contact:
        user.emergency_contact = body.emergency_contact
        db.commit()

    message = _build_message(session)
    sent = send_whatsapp_alert(contact, message)

    return {
        "sent": sent,
        "to": contact if sent else None,
    }
