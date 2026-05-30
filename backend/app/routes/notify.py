"""
backend/app/routes/notify.py

POST /notify
    B2B: dispara alerta automatica a los contactos de la empresa.
         Se llama internamente desde /analyze cuando result es drunk o caution.
    B2C (legacy): sigue funcionando con contacto personal del usuario.
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from app.db.database import get_db
from app.db.models import Company, Employee, Session as SessionModel, User
from app.services.notifier import send_alert

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notify")


class NotifyRequest(BaseModel):
    session_id: int
    emergency_contact: str | None = None


def _build_sms_message(
    employee_name: str, area: str | None, shift: str | None, pct: int
) -> str:
    location = " — ".join(filter(None, [area, shift]))
    base = (
        f"Alerta SoberLens: {employee_name} requiere verificacion presencial. "
        f"El sistema detecto posible no aptitud ({pct}% de indicadores)."
    )
    if location:
        base += f" Area: {location}."
    return base


def notify_company_contacts(
    session: SessionModel,
    db: DBSession,
) -> dict:
    """
    Envia alerta a todos los contactos de la empresa vinculada a la sesion.
    Retorna resumen de envios.
    """
    if not session.company_id or not session.employee_id:
        return {"sent": 0, "failed": 0, "skipped": "no_b2b_context"}

    company = db.query(Company).filter(Company.id == session.company_id).first()
    if not company:
        return {"sent": 0, "failed": 0, "skipped": "company_not_found"}

    contacts = company.get_alert_contacts()
    if not contacts:
        logger.warning(
            "Empresa %d no tiene contactos de alerta configurados.", company.id
        )
        return {"sent": 0, "failed": 0, "skipped": "no_contacts"}

    employee = db.query(Employee).filter(Employee.id == session.employee_id).first()
    employee_name = employee.name if employee else "Empleado"
    area = employee.area if employee else None
    shift = employee.shift if employee else None
    pct = int(session.drunk_ratio * 100)

    message = _build_sms_message(employee_name, area, shift, pct)

    sent = 0
    failed = 0
    for contact in contacts:
        result = send_alert(
            to_number=contact,
            message=message,
            contact_name=employee_name,
            pct=pct,
        )
        if result["sent"]:
            sent += 1
        else:
            failed += 1

    logger.info(
        "Alertas empresa: company_id=%d employee=%s sent=%d failed=%d",
        company.id,
        employee_name,
        sent,
        failed,
    )
    return {"sent": sent, "failed": failed}


@router.post("")
def notify(
    body: NotifyRequest,
    x_device_id: str = Header(..., alias="X-Device-ID"),
    db: DBSession = Depends(get_db),
):
    """
    Endpoint manual (B2C legacy).
    En B2B las alertas se disparan automaticamente desde /analyze.
    """
    user = db.query(User).filter(User.device_id == x_device_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    session = (
        db.query(SessionModel)
        .filter(
            SessionModel.id == body.session_id,
            SessionModel.user_id == user.id,
        )
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

    pct = int(session.drunk_ratio * 100)
    message = (
        f"Alerta SoberLens: tu contacto puede estar en estado de intoxicacion. "
        f"Verificacion detecto {pct}% de indicadores. "
        f"Por favor comunicate con el/ella."
    )

    result = send_alert(
        to_number=contact,
        message=message,
        contact_name="tu contacto",
        pct=pct,
    )

    logger.info(
        "Alerta B2C: session_id=%d channel=%s sent=%s",
        body.session_id,
        result["channel"],
        result["sent"],
    )

    return {
        "sent": result["sent"],
        "channel": result["channel"],
        "to": contact if result["sent"] else None,
    }
