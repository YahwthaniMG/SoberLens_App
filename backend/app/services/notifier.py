"""
backend/app/services/notifier.py

Envio de alertas SMS via Twilio Messaging Service.
Si las credenciales no estan configuradas, registra un warning
y no lanza excepcion — el flujo de la app continua sin alerta.
"""

import logging
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()


def send_sms_alert(to_number: str, message: str) -> bool:
    """
    Envia un SMS al contacto de emergencia via Twilio Messaging Service.

    Args:
        to_number: numero destino en formato internacional (ej: +521234567890)
        message:   texto del mensaje

    Retorna True si el mensaje se envio, False si fallo o no hay credenciales.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "")

    if not account_sid or not auth_token or not messaging_service_sid:
        logger.warning(
            "Twilio no configurado — alerta SMS omitida. "
            "Agrega TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y "
            "TWILIO_MESSAGING_SERVICE_SID al .env"
        )
        return False

    try:
        from twilio.rest import Client

        client = Client(account_sid, auth_token)
        client.messages.create(
            messaging_service_sid=messaging_service_sid,
            to=to_number,
            body=message,
        )
        logger.info("Alerta SMS enviada a %s", to_number)
        return True
    except Exception as exc:
        logger.error("Error enviando alerta SMS: %s", exc)
        return False
