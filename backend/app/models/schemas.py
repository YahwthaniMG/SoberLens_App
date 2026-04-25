"""
backend/app/models/schemas.py

Schemas Pydantic compartidos por todos los endpoints.
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# /analyze
# ---------------------------------------------------------------------------


class FrameResult(BaseModel):
    face_detected: bool
    identity_status: str = "unknown"
    # "unknown"        — no se intento verificacion (sin embedding de referencia)
    # "verified"       — cara detectada y corresponde al usuario
    # "wrong_person"   — cara detectada pero no corresponde al usuario
    # "no_face"        — no se detecto cara en el frame
    identity_similarity: float | None = None
    drunk_probability: float | None = None
    prediction: str | None = None  # "drunk" | "sober" | None


class AnalyzeResponse(BaseModel):
    total_frames: int
    analyzed_frames: int
    drunk_votes: int
    sober_votes: int
    drunk_ratio: float = Field(ge=0.0, le=1.0)
    result: str  # "drunk" | "sober" | "caution" | "inconclusive" | "no_face" | "identity_mismatch"
    frame_results: list[FrameResult]
    session_id: int
    # Resumen de validacion de identidad
    no_face_frames: int = 0
    wrong_person_frames: int = 0
    verified_frames: int = 0


class ProfileRequest(BaseModel):
    name: str
    age_range: str
    emergency_contact: str | None = None
    emergency_contact_name: str | None = None


class ContactRequest(BaseModel):
    emergency_contact: str
    emergency_contact_name: str | None = None
