import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startCamera, stopCamera, captureFrames, capturePhoto } from '../services/camera'
import { verifyFace, analyzeFrames } from '../services/api'

const TOTAL_DURATION = 5000
const FRAME_COUNT = 18

// Estados del flujo
const STATE = {
  INIT: 'init',           // iniciando camara
  VERIFYING: 'verifying', // verificando identidad
  READY: 'ready',         // listo para grabar
  RECORDING: 'recording', // grabando 5 segundos
  ANALYZING: 'analyzing', // enviando al backend
  ERROR: 'error',
}

export default function Capture() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  const [state, setState] = useState(STATE.INIT)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [identityResult, setIdentityResult] = useState(null) // { verified, similarity }

  useEffect(() => {
    async function init() {
      try {
        streamRef.current = await startCamera(videoRef.current)
        // Dar 1 segundo para que la camara se estabilice antes de verificar
        setTimeout(() => verifyIdentity(), 1000)
      } catch {
        setErrorMsg('No se pudo acceder a la cámara. Verifica los permisos.')
        setState(STATE.ERROR)
      }
    }
    init()
    return () => {
      stopCamera(streamRef.current)
      clearInterval(timerRef.current)
    }
  }, [])

  async function verifyIdentity() {
    setState(STATE.VERIFYING)
    try {
      const photo = await capturePhoto(videoRef.current)
      const result = await verifyFace(photo)
      setIdentityResult(result)

      if (result.verified) {
        setState(STATE.READY)
      } else {
        setErrorMsg(
          `Identidad no verificada (similitud: ${(result.similarity * 100).toFixed(0)}%). ` +
          'Asegúrate de que eres tú y que hay buena iluminación.'
        )
        setState(STATE.ERROR)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al verificar identidad.')
      setState(STATE.ERROR)
    }
  }

  async function startRecording() {
    setState(STATE.RECORDING)
    setProgress(0)

    // Barra de progreso en tiempo real
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / TOTAL_DURATION) * 100, 100))
    }, 100)

    try {
      const frames = await captureFrames(videoRef.current, FRAME_COUNT, TOTAL_DURATION)
      clearInterval(timerRef.current)
      setProgress(100)
      await sendToAnalyze(frames)
    } catch (err) {
      clearInterval(timerRef.current)
      setErrorMsg(err.message || 'Error durante la captura.')
      setState(STATE.ERROR)
    }
  }

  async function sendToAnalyze(frames) {
    setState(STATE.ANALYZING)
    try {
      const result = await analyzeFrames(frames)
      stopCamera(streamRef.current)
      if (result.result === 'drunk' || result.result === 'caution') {
        navigate('/alert', { state: { result } })
      } else {
        navigate('/result', { state: { result } })
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al analizar los frames. Intenta de nuevo.')
      setState(STATE.ERROR)
    }
  }

  function handleRetry() {
    setErrorMsg('')
    setIdentityResult(null)
    setState(STATE.INIT)
    startCamera(videoRef.current).then(s => {
      streamRef.current = s
      setTimeout(() => verifyIdentity(), 1000)
    })
  }

  // Mensajes de estado
  const statusMessages = {
    [STATE.INIT]: 'Iniciando cámara...',
    [STATE.VERIFYING]: 'Verificando identidad...',
    [STATE.READY]: 'Listo. Presiona para iniciar',
    [STATE.RECORDING]: 'Grabando...',
    [STATE.ANALYZING]: 'Analizando con IA...',
    [STATE.ERROR]: 'Error',
  }

  const isLoading = [STATE.INIT, STATE.VERIFYING, STATE.ANALYZING].includes(state)

  return (
    <div className="screen" style={{ background: 'var(--dark)', position: 'relative' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'rgba(255,255,255,.5)', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.6)', fontSize: 13 }}
          disabled={state === STATE.RECORDING || state === STATE.ANALYZING}
        >
          ← Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Verificación</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Camara */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.7) 100%)',
        }} />

        {/* Ovalo guia */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: 150, height: 190, borderRadius: '50%',
          border: `2.5px solid ${
            state === STATE.ERROR ? 'var(--red)' :
            state === STATE.READY ? 'var(--teal)' :
            'rgba(255,255,255,0.5)'
          }`,
          boxShadow: '0 0 0 2000px rgba(0,0,0,.35)',
          transition: 'border-color 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isLoading && (
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--teal)', borderRightColor: 'var(--teal)',
              animation: 'spin 1.2s linear infinite',
            }} />
          )}
        </div>

        {/* Estado en overlay */}
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          textAlign: 'center', zIndex: 5,
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '8px 20px',
            fontSize: 13, color: 'white', fontWeight: 500,
          }}>
            {statusMessages[state]}
          </div>
        </div>
      </div>

      {/* Barra de progreso (solo durante grabacion) */}
      {state === STATE.RECORDING && (
        <div style={{ height: 4, background: 'var(--dark3)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'var(--teal)', transition: 'width 0.1s linear',
          }} />
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '16px 28px 40px', background: 'var(--dark)' }}>
        {state === STATE.ERROR ? (
          <>
            <div style={{
              marginBottom: 12, padding: '10px 14px',
              background: 'rgba(248,81,73,.12)', borderRadius: 10,
              border: '1px solid rgba(248,81,73,.3)',
              fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
            <button className="btn-primary" onClick={handleRetry}>
              Reintentar
            </button>
          </>
        ) : state === STATE.READY ? (
          <>
            {identityResult && (
              <div style={{
                marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: 'var(--teal)',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 7l4 4 6-6"/>
                </svg>
                Identidad verificada ({(identityResult.similarity * 100).toFixed(0)}% similitud)
              </div>
            )}
            <button className="btn-primary" onClick={startRecording}>
              Iniciar grabación (5 seg)
            </button>
          </>
        ) : (
          <button className="btn-primary" disabled>
            {state === STATE.ANALYZING ? 'Analizando...' : 'Espera...'}
          </button>
        )}

        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--g1)', textAlign: 'center' }}>
          Se capturarán {FRAME_COUNT} frames en {TOTAL_DURATION / 1000} segundos
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}