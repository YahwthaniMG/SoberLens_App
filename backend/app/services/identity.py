"""
backend/app/services/identity.py

Responsabilidades:
- Extraer el embedding facial de una imagen (vector de landmarks normalizados)
- Calcular similitud coseno entre dos embeddings
- Identificar la cara del usuario cuando hay multiples rostros en el frame
- Serializar / deserializar embeddings para guardar en DB como JSON
"""

import json
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

    El landmarker se configura con num_faces=2 para poder distinguir al
    usuario correcto cuando hay dos rostros en el frame.
    """

    def __init__(self):
        base_options = mp_python.BaseOptions(
            model_asset_path=str(FACE_LANDMARKER_MODEL)
        )
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=2,
        )
        self.landmarker = mp_vision.FaceLandmarker.create_from_options(options)
        logger.info("IdentityService listo (num_faces=2).")

    # ------------------------------------------------------------------
    # Helpers internos
    # ------------------------------------------------------------------

    def _landmarks_to_embedding(self, lms) -> list[float]:
        """
        Convierte una lista de landmarks MediaPipe a un embedding normalizado.

        Centra las coordenadas respecto al centroide y normaliza a norma
        unitaria para que la similitud coseno sea invariante a escala y
        posicion.

        Retorna lista de 956 floats (478 landmarks x 2 coordenadas).
        """
        coords = np.array([[lm.x, lm.y] for lm in lms], dtype=np.float32)
        centroid = coords.mean(axis=0)
        coords -= centroid
        norm = np.linalg.norm(coords)
        if norm > 1e-6:
            coords /= norm
        return coords.flatten().tolist()

    def _detect_all_faces(self, bgr_image: np.ndarray):
        """
        Detecta hasta 2 rostros en la imagen.

        Retorna lista de listas de landmarks (0, 1 o 2 elementos).
        """
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect(mp_image)
        return result.face_landmarks  # lista de listas de NormalizedLandmark

    # ------------------------------------------------------------------
    # API publica: extraccion y registro
    # ------------------------------------------------------------------

    def extract_embedding(self, bgr_image: np.ndarray) -> list[float] | None:
        """
        Extrae el embedding de la cara mas prominente (primer resultado).

        Usado en /identity/register y /identity/verify.
        Retorna lista de 956 floats o None si no detecta cara.
        """
        faces = self._detect_all_faces(bgr_image)
        if not faces:
            return None
        return self._landmarks_to_embedding(faces[0])

    # ------------------------------------------------------------------
    # API publica: identificacion durante captura
    # ------------------------------------------------------------------

    def identify_user_face(
        self,
        bgr_image: np.ndarray,
        reference_embedding: list[float],
        threshold: float,
    ) -> dict:
        """
        Identifica cual de las caras detectadas en el frame pertenece al usuario.

        Logica:
        - Si no hay caras: retorna status="no_face"
        - Si hay 1 cara: verifica similitud contra referencia
        - Si hay 2 caras: calcula similitud de ambas, usa la que supere
          el threshold con mayor similitud

        Retorna:
            {
                "status": "verified" | "wrong_person" | "no_face",
                "similarity": float | None,   # similitud de la cara elegida
                "face_index": int | None,     # indice de la cara elegida (0 o 1)
            }
        """
        faces = self._detect_all_faces(bgr_image)

        if not faces:
            return {"status": "no_face", "similarity": None, "face_index": None}

        # Calcular similitud para cada cara detectada
        similarities = []
        for lms in faces:
            emb = self._landmarks_to_embedding(lms)
            sim = self.cosine_similarity(reference_embedding, emb)
            similarities.append(sim)

        # Elegir la cara con mayor similitud
        best_index = int(np.argmax(similarities))
        best_similarity = similarities[best_index]

        if best_similarity >= threshold:
            status = "verified"
        else:
            status = "wrong_person"

        logger.debug(
            "identify_user_face: %d caras, mejor similitud=%.4f (indice=%d) status=%s",
            len(faces),
            best_similarity,
            best_index,
            status,
        )

        return {
            "status": status,
            "similarity": round(best_similarity, 4),
            "face_index": best_index,
        }

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
