"""
backend/app/services/identity.py

Responsabilidades:
- Extraer el embedding facial de una imagen (vector de landmarks normalizados)
- Calcular similitud coseno entre dos embeddings
- Serializar / deserializar embeddings para guardar en DB como JSON
"""

import json
import math
import logging

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from app.services.predictor import FACE_LANDMARKER_MODEL

logger = logging.getLogger(__name__)


class IdentityService:
    """
    Extrae embeddings faciales y verifica identidad por similitud coseno.

    El embedding es el vector de coordenadas (x, y) normalizadas de los
    478 landmarks de MediaPipe, aplanado a 956 valores. No permite
    reconstruir la imagen original.
    """

    def __init__(self):
        base_options = mp_python.BaseOptions(
            model_asset_path=str(FACE_LANDMARKER_MODEL)
        )
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
        )
        self.landmarker = mp_vision.FaceLandmarker.create_from_options(options)
        logger.info("IdentityService listo.")

    # ------------------------------------------------------------------
    # Extraccion de embedding
    # ------------------------------------------------------------------

    def extract_embedding(self, bgr_image: np.ndarray) -> list[float] | None:
        """
        Extrae el embedding facial de una imagen BGR.

        El embedding es el vector de 478*2 = 956 coordenadas (x, y)
        normalizadas de los landmarks de MediaPipe, centrado y
        normalizado a norma unitaria para hacer la similitud coseno
        invariante a escala y posicion.

        Retorna lista de 956 floats o None si no detecta cara.
        """
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect(mp_image)

        if not result.face_landmarks:
            return None

        lms = result.face_landmarks[0]
        coords = np.array([[lm.x, lm.y] for lm in lms], dtype=np.float32)  # (478, 2)

        # Centrar respecto al centroide para invarianza a posicion
        centroid = coords.mean(axis=0)
        coords -= centroid

        # Normalizar a norma unitaria para invarianza a escala
        norm = np.linalg.norm(coords)
        if norm > 1e-6:
            coords /= norm

        return coords.flatten().tolist()  # 956 valores

    # ------------------------------------------------------------------
    # Similitud
    # ------------------------------------------------------------------

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """
        Similitud coseno entre dos embeddings.
        Retorna valor en [-1, 1]. Valores > threshold indican misma persona.
        """
        va = np.array(a, dtype=np.float64)
        vb = np.array(b, dtype=np.float64)
        norm_a = np.linalg.norm(va)
        norm_b = np.linalg.norm(vb)
        if norm_a < 1e-9 or norm_b < 1e-9:
            return 0.0
        return float(np.dot(va, vb) / (norm_a * norm_b))

    # ------------------------------------------------------------------
    # Serializacion
    # ------------------------------------------------------------------

    def serialize(self, embedding: list[float]) -> str:
        return json.dumps(embedding)

    def deserialize(self, raw: str) -> list[float]:
        return json.loads(raw)


# ---------------------------------------------------------------------------
# Instancia global
# ---------------------------------------------------------------------------
_identity_service: IdentityService | None = None


def get_identity_service() -> IdentityService:
    global _identity_service
    if _identity_service is None:
        _identity_service = IdentityService()
    return _identity_service
