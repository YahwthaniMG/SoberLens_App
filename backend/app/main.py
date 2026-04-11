"""
backend/app/main.py

Punto de entrada de la aplicacion FastAPI.
- Carga el Predictor e IdentityService una sola vez al iniciar
- Configura CORS para el frontend React
- Registra los routers
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import create_tables
from app.routes import analyze, identity, sessions, notify
from app.services.identity import get_identity_service
from app.services.predictor import get_predictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SoberLens API",
    version="0.1.0",
    description="Backend de deteccion de intoxicacion por analisis facial.",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando SoberLens API...")
    create_tables()
    get_predictor()
    get_identity_service()
    logger.info("Modelos cargados. Servidor listo.")


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(analyze.router, tags=["analyze"])
app.include_router(identity.router, tags=["identity"])
app.include_router(sessions.router, tags=["sessions"])
app.include_router(notify.router, tags=["notify"])


@app.get("/health")
async def health():
    return {"status": "ok"}
