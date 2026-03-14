# SoberLens_App — Contexto de desarrollo

Este documento es un briefing completo para continuar el desarrollo de `SoberLens_App`.
El modelo ML ya está completo en `SoberLens_Model`. Este repositorio es la aplicación PWA.

---

## Qué es SoberLens

PWA móvil de detección de intoxicación alcohólica mediante análisis facial.
El usuario se toma una verificación cada cierto tiempo; la app captura un video corto,
extrae frames, los envía al servidor, clasifica el estado (sobrio / ebrio) y alerta
a un contacto de emergencia vía WhatsApp si detecta intoxicación.

**Equipo:** Yahwthani Morales, Gabriel Torres, Sebastián Avilez, Gabriel Zaid Gutiérrez
**Universidad Panamericana — Proyecto Terminal 2025**

---

## El modelo (ya entrenado — SoberLens_Model)

| Parámetro | Valor |
|---|---|
| Algoritmo | Random Forest |
| Threshold | 0.30 |
| Recall ebrio | 94.2% |
| Recall sobrio | 80.8% |
| Accuracy test set | 89.36% |
| Features | 327 (landmarks XY, vectores, distancias, color LAB frente) |
| Landmarks | MediaPipe FaceLandmarker (478 puntos) |

**Artefactos producidos por SoberLens_Model:**
```
model.pkl       — clasificador Random Forest entrenado
scaler.pkl      — StandardScaler ajustado solo en train
features.txt    — lista ordenada de los 327 feature names
```
Estos tres archivos se copian a `backend/model/` en este repositorio.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| PWA | vite-plugin-pwa |
| Backend | FastAPI (Python) |
| Landmarks server-side | MediaPipe Tasks (Python) |
| Clasificador | scikit-learn / joblib (carga model.pkl) |
| Base de datos | SQLite (dev) → PostgreSQL (prod) |
| Alertas | Twilio WhatsApp Sandbox |
| Deploy backend | Railway |
| Deploy frontend | Vercel |

---

## Estructura del repositorio

```
SoberLens_App/
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json              # Config PWA
│   │   ├── sw.js                      # Service worker
│   │   └── icons/
│   │
│   └── src/
│       ├── pages/
│       │   ├── Onboarding.jsx         # Pantalla 01
│       │   ├── Consent.jsx            # Pantalla 01b
│       │   ├── FaceRegistration.jsx   # Pantalla 02
│       │   ├── Dashboard.jsx          # Pantalla 03
│       │   ├── Capture.jsx            # Pantalla 04
│       │   ├── Result.jsx             # Pantalla 06
│       │   ├── Alert.jsx              # Pantalla 07
│       │   └── DeferredConfirm.jsx    # Pantalla 08
│       │
│       ├── components/
│       │   ├── FaceGuide.jsx
│       │   ├── IdentityStatus.jsx
│       │   ├── FrameVotes.jsx
│       │   ├── FeatureBar.jsx
│       │   └── NavBar.jsx
│       │
│       ├── services/
│       │   ├── api.js                 # Llamadas al backend
│       │   └── camera.js             # Captura de video + extraccion de frames
│       │
│       ├── store/
│       │   └── userStore.js           # Estado global (Zustand o Context)
│       │
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS + startup
│   │   │
│   │   ├── routes/
│   │   │   ├── analyze.py             # POST /analyze
│   │   │   ├── identity.py            # POST /identity/register
│   │   │   │                          # POST /identity/verify
│   │   │   ├── sessions.py            # GET  /sessions
│   │   │   └── notify.py              # POST /notify
│   │   │
│   │   ├── services/
│   │   │   ├── predictor.py           # MediaPipe + model.pkl inference
│   │   │   ├── identity.py            # Embedding facial + cosine similarity
│   │   │   └── notifier.py            # Twilio WhatsApp
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic schemas
│   │   │
│   │   └── db/
│   │       ├── database.py
│   │       └── models.py              # Tablas: users, sessions, consents
│   │
│   ├── model/
│   │   ├── model.pkl
│   │   ├── scaler.pkl
│   │   └── features.txt
│   │
│   └── requirements.txt
│
├── .env.example
├── README.md
└── .gitignore
```

---

## Flujo de la aplicación (9 pantallas)

```
Onboarding
    │
    ▼
Consentimiento
(checkbox obligatorio: frames al servidor y eliminados)
(checkbox opcional: sesiones para re-entrenamiento)
    │
    ▼
Registro facial
(embedding de referencia enviado y guardado en servidor)
    │
    ▼
Dashboard
(estado actual, proxima verificacion, estadisticas, contacto)
    │
    ▼ (notificacion programada o manual)
Captura
(video 5 seg, 18 frames, verificacion de identidad previa)
    │
    ▼
Analizando
(frames subidos por HTTPS → MediaPipe → model.pkl → eliminados)
    │
    ├── sobrio ──────────────────────────▶ Resultado sobrio
    │                                            │
    │                                            ▼
    │                                       Dashboard
    │
    └── ebrio ───────────────────────────▶ Resultado ebrio
                                                 │
                                                 ▼
                                            Alerta WhatsApp
                                         (Twilio → contacto)
                                                 │
                                                 ▼
                                      Confirmacion diferida
                                   (push al dia siguiente:
                                   "fue correcto el resultado?")
```

---

## Decisiones de arquitectura importantes

**Privacidad de frames**
Los frames viajan al servidor por HTTPS (TLS — no se necesita encriptacion adicional).
El servidor los procesa en memoria y los elimina inmediatamente. Nunca se escriben a disco.
La garantia de privacidad es comportamental, no solo criptografica.

**Embedding facial**
Se guarda en el servidor (no en el dispositivo) como vector numérico — no como foto.
Ventajas: persiste si el usuario cambia de dispositivo; permite personalización futura del modelo.
Lo que se guarda no permite reconstruir la imagen original.

**Verificacion de identidad (anti-spoofing)**
Antes de cada captura, se compara el embedding actual con el de referencia del onboarding.
Si la similitud coseno cae por debajo del threshold, se rechaza la sesion.
Calibracion importante: el threshold debe tolerar diferencias entre estado sobrio y ebrio
del mismo usuario (el rostro cambia visiblemente con intoxicacion).

**Votacion por mayoria**
Se capturan 18 frames en 5 segundos.
Si mas del 60% votan ebrio → deteccion positiva.
Reduce falsos positivos por frames ruidosos individuales.

**Consentimiento granular**
Checkbox obligatorio: funcionamiento basico (frames procesados y eliminados).
Checkbox opcional: contribuir sesiones anonimizadas para re-entrenamiento.
El segundo puede cambiarse desde Ajustes en cualquier momento.

**Re-entrenamiento con datos de usuarios**
Solo sesiones con votacion alta (80%+) se guardan como candidatas.
Al dia siguiente, notificacion diferida pide al usuario confirmar si el resultado fue correcto.
Solo las sesiones confirmadas entran al dataset de re-entrenamiento en SoberLens_Model.

---

## Variables de entorno (.env)

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
SECRET_KEY=
DATABASE_URL=sqlite:///./soberlens.db
EMBEDDING_SIMILARITY_THRESHOLD=0.75
MODEL_PATH=model/model.pkl
SCALER_PATH=model/scaler.pkl
FEATURES_PATH=model/features.txt
```

---

## Por donde empezar (recomendacion)

**Empezar por el backend.**

El prototipo HTML ya valido el flujo visual completo. Lo que aun no se conoce es:
- Cuanto tarda el servidor en procesar 18 frames con MediaPipe + Random Forest
- Que tan pesado es cargar MediaPipe en cada request (vs cargarlo una vez al iniciar)
- El formato exacto de respuesta de la API

Esos detalles afectan decisiones del frontend (tiempos de espera, manejo de errores).

**Primer paso recomendado:** implementar `backend/app/routes/analyze.py` con
`backend/app/services/predictor.py` — el endpoint `POST /analyze` que recibe frames,
extrae landmarks con MediaPipe, escala features, clasifica con model.pkl y retorna el resultado.
Es el nucleo de toda la aplicacion.

---

## Referencia del modelo

Mejia et al. (2019). *Predicting Alcohol Intoxication from Facial Cues*.
Worcester Polytechnic Institute. DOI: 10.1109/COMPSAC.2019.10255