# SoberLens App

PWA móvil de detección de intoxicación alcohólica mediante análisis facial en tiempo real.
Proyecto terminal de Ciencias de Datos — Universidad Panamericana, 2025–2026.

**Equipo:** Yahwthani Morales · Gabriel Torres · Sebastián Avilez · Gabriel Zaid Gutiérrez

---

## Qué hace la app

SoberLens captura 18 frames del rostro del usuario en 5 segundos, extrae 327 features faciales con MediaPipe, y clasifica su estado de sobriedad con un modelo Random Forest entrenado con 14,693 imágenes (89.36% de accuracy en test set). Si detecta intoxicación, envía una alerta al contacto de emergencia vía WhatsApp.

El problema que resuelve es la **miopía alcohólica**: la incapacidad de una persona intoxicada de evaluar correctamente su propio estado. La app provee una medición objetiva y pasiva — el usuario solo se toma un selfie.

**Tres resultados posibles:**

| Estado | Criterio | Acción |
|---|---|---|
| Sobrio | drunk_ratio < 0.48 | Muestra resultado y registra en historial |
| Precaución | drunk_ratio 0.48–0.55 | Muestra advertencia y registra |
| Ebrio | drunk_ratio > 0.60 | Alerta WhatsApp al contacto de emergencia |

---

## Flujo de la aplicación

```
Onboarding
    │
    ├── Nuevo usuario ──▶ Consentimiento ──▶ Perfil ──▶ Registro facial
    │
    └── Ya tengo cuenta ──▶ Recuperación por rostro ──▶ Dashboard
                                                              │
                                          ┌───────────────────┤
                                          │                   │
                                    Captura (5s)        Recordatorios
                                          │             (calendario)
                                          ▼
                                   Verificación de
                                   identidad (18 frames)
                                          │
                                          ├── Sin cara suficiente ──▶ Error + reintentar
                                          ├── Persona incorrecta ──▶ Error + reintentar
                                          │
                                          ▼
                                   Clasificación ML
                                          │
                                    ┌─────┴──────┐
                                    │            │
                                  Sobrio       Ebrio / Precaución
                                    │            │
                                    ▼            ▼
                                Resultado    Alerta WhatsApp
                                             + Resultado
                                                 │
                                                 ▼
                                        Confirmación diferida
                                        (disponible 24h después)
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Estado global | Zustand |
| PWA | vite-plugin-pwa |
| Backend | FastAPI (Python 3.11) |
| Landmarks | MediaPipe Tasks (Python) |
| Clasificador | scikit-learn — Random Forest (model.pkl) |
| Base de datos | SQLite (dev) → PostgreSQL (prod) |
| ORM | SQLAlchemy 2.0 (Mapped columns) |
| Alertas | Twilio WhatsApp Sandbox |
| Deploy backend | Railway |
| Deploy frontend | Vercel |

---

## Estructura del repositorio

```
SoberLens_App/
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Onboarding.jsx          # Pantalla de bienvenida
│       │   ├── Consent.jsx             # Consentimiento de datos
│       │   ├── FaceRegistration.jsx    # Registro de embedding facial
│       │   ├── DeviceRecovery.jsx      # Recuperación de cuenta por rostro
│       │   ├── Dashboard.jsx           # Panel principal
│       │   ├── Capture.jsx             # Captura de 18 frames (5 seg)
│       │   ├── Result.jsx              # Resultado de la verificación
│       │   ├── Alert.jsx               # Pantalla de alerta de intoxicación
│       │   ├── DeferredConfirm.jsx     # Confirmación diferida (24h después)
│       │   ├── Schedule.jsx            # Calendario de recordatorios + historial
│       │   ├── UserProfile.jsx         # Perfil, estadísticas y racha sobria
│       │   └── Privacy.jsx             # Aviso de privacidad
│       │
│       ├── services/
│       │   ├── api.js                  # Llamadas al backend (fetch + headers)
│       │   ├── camera.js               # Acceso a cámara + captura de frames
│       │   └── events.js               # Eventos de recordatorio (localStorage)
│       │
│       └── store/
│           └── userStore.js            # Estado global (Zustand)
│
├── backend/
│   └── app/
│       ├── main.py                     # FastAPI app + CORS + startup
│       ├── routes/
│       │   ├── analyze.py              # POST /analyze
│       │   ├── identity.py             # POST /identity/register|verify|recover
│       │   │                           # PATCH /identity/profile|contact
│       │   ├── sessions.py             # GET /sessions, PATCH /sessions/{id}/confirm
│       │   └── notify.py               # POST /notify
│       │
│       ├── services/
│       │   ├── predictor.py            # MediaPipe + model.pkl inference
│       │   ├── identity.py             # Embedding facial + cosine similarity
│       │   └── notifier.py             # Twilio WhatsApp
│       │
│       ├── models/
│       │   └── schemas.py              # Pydantic schemas
│       │
│       └── db/
│           ├── database.py             # SQLAlchemy engine + session
│           └── models.py               # Tablas: users, sessions, consents
│
├── .env.example
└── README.md
```

---

## API — endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/analyze` | Recibe hasta 18 frames, clasifica y guarda sesión |
| POST | `/identity/register` | Registra embedding facial de referencia |
| POST | `/identity/verify` | Verifica que el frame actual es el usuario registrado |
| POST | `/identity/recover` | Busca usuario por similitud facial (cambio de dispositivo) |
| PATCH | `/identity/profile` | Actualiza nombre, edad y contacto de emergencia |
| PATCH | `/identity/contact` | Actualiza solo el contacto de emergencia |
| GET | `/sessions` | Lista el historial de sesiones del usuario (paginado) |
| PATCH | `/sessions/{id}/confirm` | Confirmación diferida del resultado (requiere 24h) |
| POST | `/notify` | Envía alerta WhatsApp al contacto de emergencia |
| GET | `/health` | Health check del servidor |

Todos los endpoints (excepto `/health`) requieren el header `X-Device-ID` con el UUID del dispositivo.

---

## Modelo de datos

### `users`

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| device_id | VARCHAR(128) | UUID generado en el frontend |
| name | VARCHAR(64) | Nombre del usuario |
| age_range | VARCHAR(16) | Rango de edad |
| face_embedding | TEXT | Vector JSON de 956 floats (478 landmarks × 2) |
| emergency_contact | VARCHAR(32) | Número WhatsApp del contacto |
| emergency_contact_name | VARCHAR(64) | Nombre del contacto |
| created_at / updated_at | DATETIME | — |

### `sessions`

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| user_id | FK → users | — |
| result | VARCHAR(16) | "drunk" / "sober" / "caution" / "inconclusive" |
| drunk_ratio | FLOAT | Fracción de frames clasificados como ebrio |
| total_frames | INTEGER | Frames recibidos |
| analyzed_frames | INTEGER | Frames con cara detectada y verificada |
| drunk_votes / sober_votes | INTEGER | — |
| user_confirmed | BOOLEAN | NULL = pendiente, True/False = confirmado |
| confirmed_at | DATETIME | Fecha de confirmación diferida |
| retraining_candidate | BOOLEAN | True si drunk_ratio ≥ 0.80 y confirmado |
| created_at | DATETIME | — |

### `consents`

| Columna | Tipo | Descripción |
|---|---|---|
| user_id | FK → users | — |
| accepted_processing | BOOLEAN | Obligatorio: frames procesados y eliminados |
| accepted_retraining | BOOLEAN | Opcional: sesiones para re-entrenamiento |
| retraining_updated_at | DATETIME | Última vez que cambió el consentimiento opcional |

---

## Instalación y desarrollo local

### Requisitos

- Python 3.11 (MediaPipe no soporta 3.13)
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Crea el archivo `backend/.env` con las variables necesarias:

```env
MODEL_THRESHOLD=0.34
VOTE_THRESHOLD=0.60
DATABASE_URL=sqlite:///./soberlens.db
EMBEDDING_SIMILARITY_THRESHOLD=0.75
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+17406697621
TWILIO_WHATSAPP_TEMPLATE_SID=
TWILIO_MESSAGING_SERVICE_SID=
```

Copia los artefactos del modelo desde `SoberLens_Model`:

```bash
cp ../SoberLens_Model/output/models/model.pkl backend/model/
cp ../SoberLens_Model/output/models/scaler.pkl backend/model/
cp ../SoberLens_Model/output/models/features.txt backend/model/
```

Inicia el servidor:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

El servidor queda disponible en `http://localhost:8000`. La documentación interactiva (Swagger) en `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Decisiones de arquitectura

**Privacidad por diseño.** Los frames nunca se escriben a disco en el servidor — se procesan en memoria y se eliminan. Lo que persiste en la base de datos es el embedding facial (vector numérico, no la imagen) y el resultado de la sesión.

**Identificación por device_id.** No hay sistema de login. El frontend genera un UUID al primer uso y lo guarda en `localStorage`. Ese UUID viaja como header `X-Device-ID` en cada request. Si el usuario cambia de dispositivo, puede recuperar su cuenta escaneando su rostro (`POST /identity/recover`).

**Verificación de identidad durante captura.** Antes de clasificar cada frame, el servicio `IdentityService` compara el embedding del frame actual con el de referencia del usuario (similitud coseno). Si más del 30% de los frames con cara no corresponden al usuario registrado, la sesión se rechaza con `HTTP 409`. Esto previene que otra persona use la app en nombre del usuario.

**Confirmación diferida.** Las sesiones solo pueden confirmarse 24 horas después de realizarse (`HTTP 425 Too Early` si se intenta antes). El objetivo es obtener una respuesta honesta cuando el usuario ya está sobrio. Las sesiones confirmadas con `drunk_ratio ≥ 0.80` se marcan como `retraining_candidate=True` para alimentar el re-entrenamiento del modelo.

**Votos por mayoría.** Se capturan 18 frames en 5 segundos. El resultado final se calcula por votación ponderada: `drunk_ratio = drunk_votes / analyzed_frames`. El estado "precaución" solo aparece en la franja `0.48–0.55` para reducir su frecuencia y que la mayoría de resultados sean binarios (sobrio o ebrio).

---

## Estado actual del desarrollo

### Completado

- Pipeline ML completo en `SoberLens_Model` (Random Forest, 89.36% accuracy)
- Backend FastAPI con los 10 endpoints operativos
- Validación de identidad por frame durante captura (detección de cara ausente y persona incorrecta)
- Verificación facial pre-captura (anti-spoofing)
- Restricción de 24h para confirmación diferida
- Sistema de alertas WhatsApp (Twilio, pendiente credenciales activas)
- Frontend completo: onboarding, captura, resultado, alerta, historial
- Recuperación de cuenta por rostro en nuevo dispositivo
- Calendario de recordatorios con historial de sesiones
- Página de perfil con racha de días sobrios y estadísticas históricas

### Pendiente

- **Deploy** — Railway (backend) + Vercel (frontend)
- **Push notifications** — VAPID + service worker para recordatorios automáticos (V/S/D) y eventos del calendario. La lógica y UI están implementadas; falta la activación post-deploy.
- **Endpoint de consentimiento** — `POST /consent` para persistir el consentimiento en DB (actualmente se guarda solo en `localStorage`)
- **Modo recuperación de alcohol** — verificaciones diarias obligatorias con horarios aleatorios dentro de un rango configurable (UI diseñada, lógica de scheduling pendiente de push notifications)
- **PostgreSQL en producción** — la app está preparada para el swap (`DATABASE_URL` en `.env`), pendiente de crear la instancia en Railway
- **Credenciales Twilio activas** — el notifier maneja gracefully la ausencia de credenciales; falta la cuenta activa

---

## Referencia académica

Mejia, J. et al. (2019). *Predicting Alcohol Intoxication from Facial Cues*. Worcester Polytechnic Institute. DOI: [10.1109/COMPSAC.2019.10255](https://doi.org/10.1109/COMPSAC.2019.10255)