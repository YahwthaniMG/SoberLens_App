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
    drunk_probability: float | None = None
    prediction: str | None = None  # "drunk" | "sober" | None


class AnalyzeResponse(BaseModel):
    total_frames: int
    analyzed_frames: int
    drunk_votes: int
    sober_votes: int
    drunk_ratio: float = Field(ge=0.0, le=1.0)
    result: str  # "drunk" | "sober" | "inconclusive"
    frame_results: list[FrameResult]
    session_id: int
