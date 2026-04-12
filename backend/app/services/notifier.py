"""
backend/app/services/notifier.py

Envio de alertas WhatsApp via Twilio Sandbox.
Si las credenciales no estan configuradas, registra un warning
y no lanza excepcion — el flujo de la app continua sin alerta.
"""

import logging
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def send_whatsapp_alert(to_number: str, message: str) -> bool:
    """
    Envia un mensaje WhatsApp al contacto de emergencia.

    Args:
        to_number: numero destino en formato internacional (ej: +521234567890)
        message:   texto del mensaje

    Retorna True si el mensaje se envio, False si fallo o no hay credenciales.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

    if not account_sid or not auth_token:
        logger.warning(
            "Twilio no configurado — alerta WhatsApp omitida. "
            "Agrega TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN al .env"
        )
        return False

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
        client.messages.create(
            from_=from_number,
            to=f"whatsapp:{to_number}",
            body=message,
        )
        logger.info("Alerta WhatsApp enviada a %s", to_number)
        return True
    except Exception as exc:
        logger.error("Error enviando alerta WhatsApp: %s", exc)
        return False
