// frontend/src/pages/AccessPointCapture.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { startCamera, stopCamera, captureFrames, capturePhoto } from '../services/camera'
import { analyzeFramesAccessPoint, verifyFaceAccessPoint } from '../services/api'

const TOTAL_DURATION = 5000
const FRAME_COUNT    = 18

const STATE = {
  INIT:      'init',
  VERIFYING: 'verifying',
  READY:     'ready',
  RECORDING: 'recording',
  ANALYZING: 'analyzing',
  ERROR:     'error',
}

export default function AccessPointCapture() {
  const navigate = useNavigate()
  const {
    accessPointEmployeeId, accessPointCompanyId,
    accessPointWorkerName, accessPointHasEmbedding,
    clearAccessPointEmployee,
  } = useUserStore()

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const timerRef  = useRef(null)

  const [state, setState]           = useState(STATE.INIT)
  const [progress, setProgress]     = useState(0)
  const [errorMsg, setErrorMsg]     = useState('')
  const [identityResult, setIdentityResult] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        streamRef.current = await startCamera(videoRef.current)
        // Si tiene embedding, verificar identidad antes de permitir captura
        if (accessPointHasEmbedding) {
          setTimeout(() => verifyIdentity(), 1000)
        } else {
          setState(STATE.READY)
        }
      } catch {
        setErrorMsg('No se pudo acceder a la camara.')
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
      const photo  = await capturePhoto(videoRef.current)
      const result = await verifyFaceAccessPoint(
        photo,
        Number(accessPointEmployeeId),
        Number(accessPointCompanyId),
      )
      setIdentityResult(result)
      if (result.verified) {
        setState(STATE.READY)
      } else {
        setErrorMsg(
          `Identidad no verificada (similitud: ${(result.similarity * 100).toFixed(0)}%). ` +
          'Asegurate de que eres tu y que hay buena iluminacion.'
        )
        setState(STATE.ERROR)
      }
    } catch (err) {
      // Si no hay embedding registrado, permitir igual
      if (err.message?.includes('No hay embedding')) {
        setState(STATE.READY)
      } else {
        setErrorMsg(err.message || 'Error al verificar identidad.')
        setState(STATE.ERROR)
      }
    }
  }

  async function startRecording() {
    setState(STATE.RECORDING)
    setProgress(0)
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setProgress(Math.min(((Date.now() - startTime) / TOTAL_DURATION) * 100, 100))
    }, 100)

    try {
      const frames = await captureFrames(videoRef.current, FRAME_COUNT, TOTAL_DURATION)
      clearInterval(timerRef.current)
      setProgress(100)
      setState(STATE.ANALYZING)
      const result = await analyzeFramesAccessPoint(
        frames,
        Number(accessPointEmployeeId),
        Number(accessPointCompanyId),
      )
      stopCamera(streamRef.current)
      navigate('/access-point/result', { state: { result } })
    } catch (err) {
      clearInterval(timerRef.current)
      setErrorMsg(err.message || 'Error al analizar. Intenta de nuevo.')
      setState(STATE.ERROR)
    }
  }

  function handleRetry() {
    setErrorMsg('')
    setIdentityResult(null)
    setState(STATE.INIT)
    startCamera(videoRef.current).then(s => {
      streamRef.current = s
      if (accessPointHasEmbedding) {
        setTimeout(() => verifyIdentity(), 1000)
      } else {
        setState(STATE.READY)
      }
    })
  }

  const isLoading = [STATE.INIT, STATE.VERIFYING, STATE.ANALYZING].includes(state)

  const statusMessages = {
    [STATE.INIT]:      'Iniciando camara...',
    [STATE.VERIFYING]: 'Verificando identidad...',
    [STATE.READY]:     `Listo${accessPointWorkerName ? ', ' + accessPointWorkerName.split(' ')[0] : ''}. Presiona para iniciar`,
    [STATE.RECORDING]: 'Grabando...',
    [STATE.ANALYZING]: 'Analizando...',
    [STATE.ERROR]:     'Error',
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)', position: 'relative' }}>
      <div className="status-bar" style={{ color: 'rgba(255,255,255,.5)',
        position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => { clearAccessPointEmployee(); navigate('/access-point/worker') }}
          disabled={state === STATE.RECORDING || state === STATE.ANALYZING}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,.6)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
          Verificacion de inicio de turno
        </span>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.7) 100%)',
        }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '72vw', height: '58vh', borderRadius: '50%',
          border: `2.5px solid ${state === STATE.ERROR ? 'var(--red)' : state === STATE.READY ? 'var(--teal)' : 'rgba(255,255,255,0.5)'}`,
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

      {state === STATE.RECORDING && (
        <div style={{ height: 4, background: 'var(--dark3)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'var(--teal)', transition: 'width 0.1s linear',
          }} />
        </div>
      )}

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
              Iniciar verificacion (5 seg)
            </button>
          </>
        ) : (
          <button className="btn-primary" disabled>
            {state === STATE.ANALYZING ? 'Analizando...' : 'Espera...'}
          </button>
        )}
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--g1)', textAlign: 'center' }}>
          Se capturaran {FRAME_COUNT} frames en {TOTAL_DURATION / 1000} segundos
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}