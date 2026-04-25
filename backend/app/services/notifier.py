"""
backend/app/services/notifier.py

Envio de alertas via Twilio.
Estrategia:
  1. Intenta WhatsApp Business con plantilla aprobada.
  2. Si falla, cae a SMS via Messaging Service.
"""

from dotenv import load_dotenv
import logging
import os

logger = logging.getLogger(__name__)
load_dotenv()


def _normalize_mx_number(number: str) -> str:
    """
    Normaliza numeros mexicanos para WhatsApp.
    WhatsApp requiere +52 1 XXXXXXXXXX (10 digitos con el 1 despues del 52).
    Si el numero tiene 10 digitos locales o le falta el 1, lo agrega.
    """
    # Quitar espacios y guiones
    n = number.strip().replace(" ", "").replace("-", "")

    # Si ya tiene el formato correcto, retornar tal cual
    if n.startswith("+521") and len(n) == 13:
        return n

    # +5233... -> +52133... (le falta el 1)
    if n.startswith("+52") and len(n) == 12:
        return "+521" + n[3:]

    # 10 digitos locales -> +521...
    if n.startswith("33") or n.startswith("55") or n.startswith("81"):
        if len(n) == 10:
            return "+521" + n

    # Para otros paises o formatos ya correctos, retornar sin modificar
    return n


def _send_whatsapp(client, to_number: str, contact_name: str, pct: int) -> bool:
    """
    Envia via WhatsApp Business usando plantilla aprobada.
    La plantilla es:
      Alerta SoberLens: {{1}} puede estar en estado de intoxicacion.
      La verificacion detecto intoxicacion en {{2}}% de los analisis.
      Por favor comunicate con el/ella.
    """
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "")
    template_sid = os.getenv("TWILIO_WHATSAPP_TEMPLATE_SID", "")

    if not from_number or not template_sid:
        return False

    normalized = _normalize_mx_number(to_number)
    to_wa = (
        normalized if normalized.startswith("whatsapp:") else f"whatsapp:{normalized}"
    )
    from_wa = (
        from_number
        if from_number.startswith("whatsapp:")
        else f"whatsapp:{from_number}"
    )

    try:
        client.messages.create(
            from_=from_wa,
            to=to_wa,
            content_sid=template_sid,
            content_variables=f'{{"1": "{contact_name}", "2": "{pct}"}}',
        )
        logger.info("Alerta WhatsApp enviada a %s", normalized)
        return True
    except Exception as exc:
        logger.warning("WhatsApp fallo, intentando SMS: %s", exc)
        return False


def _send_sms(client, to_number: str, message: str) -> bool:
    """Envia SMS via Messaging Service como fallback."""
    messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "")

    if not messaging_service_sid:
        return False

    try:
        client.messages.create(
            messaging_service_sid=messaging_service_sid,
            to=to_number,
            body=message,
        )
        logger.info("Alerta SMS enviada a %s", to_number)
        return True
    except Exception as exc:
        logger.error("SMS fallo: %s", exc)
        return False


def send_alert(
    to_number: str, message: str, contact_name: str = "tu contacto", pct: int = 0
) -> dict:
    """
    Envia alerta al contacto de emergencia.
    Intenta WhatsApp Business primero, cae a SMS si falla.

    Retorna:
        {"sent": bool, "channel": "whatsapp" | "sms" | None}
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    if not account_sid or not auth_token:
        logger.warning("Twilio no configurado — alerta omitida.")
        return {"sent": False, "channel": None}

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
    except Exception as exc:
        logger.error("Error inicializando cliente Twilio: %s", exc)
        return {"sent": False, "channel": None}
    """
    if _send_whatsapp(client, to_number, contact_name, pct):
        return {"sent": True, "channel": "whatsapp"}
    """
    if _send_sms(client, to_number, message):
        return {"sent": True, "channel": "sms"}

    return {"sent": False, "channel": None}
