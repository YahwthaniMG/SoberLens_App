"""
backend/app/services/predictor.py

Responsabilidades:
- Cargar model.pkl, scaler.pkl y features.txt una sola vez al iniciar el servidor
- Extraer los 327 features de un frame (imagen BGR en numpy array)
- Clasificar el frame y retornar probabilidad de intoxicacion
"""

import os
import math
import logging
from pathlib import Path

import cv2
import numpy as np
import joblib
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rutas a los artefactos del modelo
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "model" / "model.pkl"))
SCALER_PATH = Path(os.getenv("SCALER_PATH", BASE_DIR / "model" / "scaler.pkl"))
FEATURES_PATH = Path(os.getenv("FEATURES_PATH", BASE_DIR / "model" / "features.txt"))

# Ruta al modelo de tarea de MediaPipe FaceLandmarker (.task)
# Descargable desde: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
FACE_LANDMARKER_MODEL = Path(
    os.getenv(
        "FACE_LANDMARKER_MODEL",
        BASE_DIR / "model" / "face_landmarker.task",
    )
)

# Indices de landmarks usados (extraidos de features.txt)
LANDMARK_INDICES = [
    0,
    1,
    2,
    7,
    10,
    13,
    33,
    37,
    39,
    40,
    58,
    61,
    67,
    78,
    80,
    81,
    82,
    98,
    103,
    109,
    116,
    123,
    132,
    133,
    136,
    144,
    145,
    147,
    148,
    149,
    150,
    152,
    153,
    154,
    155,
    163,
    172,
    176,
    185,
    191,
    213,
    249,
    251,
    263,
    267,
    269,
    270,
    284,
    291,
    297,
    308,
    310,
    311,
    312,
    327,
    332,
    338,
    345,
    352,
    356,
    362,
    373,
    374,
    376,
    380,
    381,
    382,
    389,
    390,
    409,
    415,
    433,
    468,
    473,
]

# Pares de landmarks para calcular distancias lineales (line00..line26)
# Extraidos directamente de LANDMARK_PAIRS en SoberLens_Model
LINE_PAIRS = [
    # Apertura vertical ojo izquierdo (droopiness)
    (145, 159),  # line00
    (144, 160),  # line01
    (153, 158),  # line02
    (154, 157),  # line03
    # Apertura vertical ojo derecho
    (374, 386),  # line04
    (373, 387),  # line05
    (380, 385),  # line06
    (381, 384),  # line07
    # Ancho de ojos
    (33, 133),  # line08 ancho ojo izquierdo
    (362, 263),  # line09 ancho ojo derecho
    # Apertura vertical de la boca
    (13, 14),  # line10
    (82, 87),  # line11
    (312, 317),  # line12
    # Ancho de la boca
    (61, 291),  # line13
    (78, 308),  # line14
    # Nariz a boca
    (1, 13),  # line15
    (1, 0),  # line16
    # Distancia entre ojos
    (33, 263),  # line17
    # Distancia ojo-boca
    (159, 13),  # line18
    (386, 13),  # line19
    # Alto del contorno facial
    (10, 152),  # line20
    # Anchura de mejillas
    (116, 345),  # line21
    (123, 352),  # line22
    # Angulo de cejas
    (70, 63),  # line23 ceja izquierda
    (107, 55),  # line24 ceja izquierda
    (300, 293),  # line25 ceja derecha
    (336, 285),  # line26 ceja derecha
]

# Landmarks que delimitan la region de la frente para analisis de color
FOREHEAD_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 103, 67, 109]


class Predictor:
    """Singleton que mantiene el modelo y el landmarker cargados en memoria."""

    def __init__(self):
        logger.info("Cargando artefactos del modelo...")
        self.feature_names = self._load_feature_names()
        self.scaler = joblib.load(SCALER_PATH)
        self.model = joblib.load(MODEL_PATH)
        self.landmarker = self._build_landmarker()
        logger.info("Predictor listo. Features esperados: %d", len(self.feature_names))

    # ------------------------------------------------------------------
    # Inicializacion interna
    # ------------------------------------------------------------------

    def _load_feature_names(self):
        with open(FEATURES_PATH, "r") as f:
            return [line.strip() for line in f if line.strip()]

    def _build_landmarker(self):
        base_options = mp_python.BaseOptions(
            model_asset_path=str(FACE_LANDMARKER_MODEL)
        )
        options = mp_vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            num_faces=1,
        )
        return mp_vision.FaceLandmarker.create_from_options(options)

    # ------------------------------------------------------------------
    # Extraccion de features
    # ------------------------------------------------------------------

    def _extract_landmarks(self, bgr_image: np.ndarray):
        """
        Retorna lista de 478 landmarks normalizados (x, y) o None si no detecta cara.
        """
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect(mp_image)
        if not result.face_landmarks:
            return None
        return result.face_landmarks[0]  # lista de NormalizedLandmark

    def _landmark_features(self, landmarks) -> dict:
        """
        Coordenadas XY normalizadas de los landmarks seleccionados.
        lm{idx}_x, lm{idx}_y
        """
        feats = {}
        for idx in LANDMARK_INDICES:
            lm = landmarks[idx]
            key = f"lm{idx:03d}"
            feats[f"{key}_x"] = lm.x
            feats[f"{key}_y"] = lm.y
        return feats

    def _vector_features(self, landmarks, nose_idx=1) -> dict:
        """
        Para cada landmark seleccionado: distancia euclidea y angulo
        respecto al landmark de la nariz (punto de referencia central).
        vec{idx}_dist, vec{idx}_angle
        """
        nose = landmarks[nose_idx]
        feats = {}
        for idx in LANDMARK_INDICES:
            lm = landmarks[idx]
            dx = lm.x - nose.x
            dy = lm.y - nose.y
            dist = math.hypot(dx, dy)
            angle = math.atan2(dy, dx)
            key = f"vec{idx:03d}"
            feats[f"{key}_dist"] = dist
            feats[f"{key}_angle"] = angle
        return feats

    def _line_features(self, landmarks) -> dict:
        """
        Distancias euclidianas entre pares de landmarks predefinidos.
        line00_dist ... line26_dist
        """
        feats = {}
        for i, (a, b) in enumerate(LINE_PAIRS):
            lm_a = landmarks[a]
            lm_b = landmarks[b]
            dist = math.hypot(lm_a.x - lm_b.x, lm_a.y - lm_b.y)
            feats[f"line{i:02d}_dist"] = dist
        return feats

    def _forehead_color(self, bgr_image: np.ndarray, landmarks) -> dict:
        """
        Color promedio LAB y canal R de la region de la frente.
        Usa FOREHEAD_LANDMARKS para delimitar el bounding box de la frente.

        Retorna: forehead_L, forehead_a, forehead_b, forehead_R
        """
        h, w = bgr_image.shape[:2]

        # Coordenadas pixel de los landmarks de la frente
        pts = [
            (int(landmarks[i].x * w), int(landmarks[i].y * h))
            for i in FOREHEAD_LANDMARKS
        ]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]

        top_y = max(0, min(ys))
        bot_y = min(h, max(ys))
        left_x = max(0, min(xs))
        right_x = min(w, max(xs))

        # Asegurar que el recorte sea valido
        top_y = max(0, top_y)
        bot_y = max(top_y + 1, min(bot_y, h))
        left_x = max(0, min(left_x, right_x - 1))
        right_x = min(w, right_x)

        roi = bgr_image[top_y:bot_y, left_x:right_x]
        if roi.size == 0:
            return {
                "forehead_L": 0.0,
                "forehead_a": 0.0,
                "forehead_b": 0.0,
                "forehead_R": 0.0,
            }

        lab = cv2.cvtColor(roi, cv2.COLOR_BGR2Lab)
        mean_lab = lab.mean(axis=(0, 1))

        # Canal R (BGR -> indice 2)
        mean_R = float(roi[:, :, 2].mean())

        return {
            "forehead_L": float(mean_lab[0]),
            "forehead_a": float(mean_lab[1]),
            "forehead_b": float(mean_lab[2]),
            "forehead_R": mean_R,
        }

    def _build_feature_vector(self, bgr_image: np.ndarray, landmarks) -> np.ndarray:
        """
        Ensambla el vector de 327 features en el orden exacto de features.txt.
        """
        feats = {}
        feats.update(self._landmark_features(landmarks))
        feats.update(self._vector_features(landmarks))
        feats.update(self._line_features(landmarks))
        feats.update(self._forehead_color(bgr_image, landmarks))

        # Construir array en el orden de features.txt
        vector = np.array(
            [feats[name] for name in self.feature_names], dtype=np.float32
        )
        return vector

    # ------------------------------------------------------------------
    # Inferencia publica
    # ------------------------------------------------------------------

    def predict_frame(self, bgr_image: np.ndarray) -> dict:
        """
        Clasifica un solo frame.

        Retorna:
            {
                "face_detected": bool,
                "drunk_probability": float | None,
                "prediction": "drunk" | "sober" | None,
            }
        """
        landmarks = self._extract_landmarks(bgr_image)
        if landmarks is None:
            return {
                "face_detected": False,
                "drunk_probability": None,
                "prediction": None,
            }

        vector = self._build_feature_vector(bgr_image, landmarks)
        scaled = self.scaler.transform(vector.reshape(1, -1))
        prob = float(self.model.predict_proba(scaled)[0][1])  # P(drunk)

        threshold = float(os.getenv("MODEL_THRESHOLD", 0.30))
        label = "drunk" if prob >= threshold else "sober"

        return {
            "face_detected": True,
            "drunk_probability": round(prob, 4),
            "prediction": label,
        }

    def predict_session(self, bgr_frames: list[np.ndarray]) -> dict:
        """
        Clasifica una sesion completa (lista de frames BGR).
        Aplica votacion por mayoria con threshold del 60%.

        Retorna:
            {
                "total_frames": int,
                "analyzed_frames": int,   # frames con cara detectada
                "drunk_votes": int,
                "sober_votes": int,
                "drunk_ratio": float,
                "result": "drunk" | "sober" | "inconclusive",
                "frame_results": list[dict],
            }
        """
        VOTE_THRESHOLD = float(os.getenv("VOTE_THRESHOLD", 0.60))

        frame_results = [self.predict_frame(f) for f in bgr_frames]

        analyzed = [r for r in frame_results if r["face_detected"]]
        if not analyzed:
            return {
                "total_frames": len(bgr_frames),
                "analyzed_frames": 0,
                "drunk_votes": 0,
                "sober_votes": 0,
                "drunk_ratio": 0.0,
                "result": "inconclusive",
                "frame_results": frame_results,
            }

        drunk_votes = sum(1 for r in analyzed if r["prediction"] == "drunk")
        sober_votes = len(analyzed) - drunk_votes
        drunk_ratio = drunk_votes / len(analyzed)

        result = "drunk" if drunk_ratio >= VOTE_THRESHOLD else "sober"

        return {
            "total_frames": len(bgr_frames),
            "analyzed_frames": len(analyzed),
            "drunk_votes": drunk_votes,
            "sober_votes": sober_votes,
            "drunk_ratio": round(drunk_ratio, 4),
            "result": result,
            "frame_results": frame_results,
        }


# ---------------------------------------------------------------------------
# Instancia global — se inicializa una vez en startup de FastAPI
# ---------------------------------------------------------------------------
_predictor: Predictor | None = None


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
    return _predictor
