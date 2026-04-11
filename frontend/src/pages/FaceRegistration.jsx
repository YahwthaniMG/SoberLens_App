import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { startCamera, stopCamera, capturePhoto } from '../services/camera'
import { registerFace } from '../services/api'

const STEPS = [
  { id: 'lighting', label: 'Iluminación adecuada' },
  { id: 'centered', label: 'Rostro centrado' },
  { id: 'captured', label: 'Foto capturada' },
  { id: 'registered', label: 'Perfil registrado' },
]

export default function FaceRegistration() {
  const navigate = useNavigate()
  const setFaceRegistered = useUserStore(s => s.setFaceRegistered)

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [status, setStatus] = useState('idle') // idle | capturing | processing | done | error
  const [completedSteps, setCompletedSteps] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    async function init() {
      try {
        streamRef.current = await startCamera(videoRef.current)
        setCompletedSteps(['lighting'])
        setProgress(25)
      } catch (err) {
        setErrorMsg('No se pudo acceder a la cámara. Verifica los permisos.')
        setStatus('error')
      }
    }
    init()
    return () => stopCamera(streamRef.current)
  }, [])

  async function handleCapture() {
    setStatus('capturing')
    setCompletedSteps(['lighting', 'centered'])
    setProgress(50)

    try {
      const blob = await capturePhoto(videoRef.current)

      setCompletedSteps(['lighting', 'centered', 'captured'])
      setProgress(75)
      setStatus('processing')

      await registerFace(blob)

      setCompletedSteps(['lighting', 'centered', 'captured', 'registered'])
      setProgress(100)
      setStatus('done')
      setFaceRegistered(true)

      stopCamera(streamRef.current)

      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar. Intenta de nuevo.')
      setStatus('error')
      setCompletedSteps(['lighting'])
      setProgress(25)
    }
  }

  function handleRetry() {
    setStatus('idle')
    setErrorMsg('')
    setCompletedSteps(['lighting'])
    setProgress(25)
    startCamera(videoRef.current).then(s => {
      streamRef.current = s
    })
  }

  const isProcessing = status === 'capturing' || status === 'processing'
  const isDone = status === 'done'

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
          disabled={isProcessing}
        >
          ← Atrás
        </button>
        <span style={{ fontSize: 12, color: 'var(--g1)' }}>Registro facial</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'relative', margin: '0 auto', width: '100%', maxWidth: 390 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            aspectRatio: '4/3',
            objectFit: 'cover',
            display: 'block',
            background: 'var(--dark3)',
          }}
        />

        {/* Overlay oscuro */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Ovalo guia */}
          <div style={{
            width: 150, height: 190, borderRadius: '50%',
            border: `2.5px solid ${isDone ? 'var(--teal)' : 'rgba(255,255,255,0.6)'}`,
            position: 'relative',
            boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)',
            transition: 'border-color 0.3s',
          }}>
            {isProcessing && (
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'var(--teal)',
                borderRightColor: 'var(--teal)',
                animation: 'spin 1.2s linear infinite',
              }} />
            )}
            <div style={{
              position: 'absolute', bottom: -28, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9, color: isDone ? 'var(--teal)' : 'rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: 0.5,
              fontFamily: 'var(--mono)',
            }}>
              {isDone ? 'REGISTRADO' : 'CENTRA TU ROSTRO'}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ margin: '16px 28px 0', height: 4, background: 'var(--dark3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'var(--teal)', borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Checklist */}
      <div style={{ margin: '12px 28px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STEPS.map(step => {
          const done = completedSteps.includes(step.id)
          const isActive = !done && completedSteps.length === STEPS.findIndex(s => s.id === step.id)
          return (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10, background: 'var(--dark3)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                background: done ? 'var(--teal)' : 'var(--dark2)',
                border: done ? 'none' : '1px solid var(--dark3)',
                color: done ? 'var(--dark)' : 'var(--g1)',
              }}>
                {done ? '✓' : ''}
              </div>
              <span style={{ fontSize: 11, color: done ? 'var(--teal)' : 'var(--g1)' }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{
          margin: '12px 28px 0', padding: '10px 14px',
          background: 'rgba(248,81,73,0.12)', borderRadius: 10,
          border: '1px solid rgba(248,81,73,0.3)',
          fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{ padding: '12px 28px 32px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {status === 'error' ? (
          <button className="btn-primary" onClick={handleRetry}>
            Reintentar
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleCapture}
            disabled={isProcessing || isDone || status === 'idle' && completedSteps.length === 0}
          >
            {isProcessing ? 'Procesando...' : isDone ? 'Listo' : 'Capturar foto de referencia'}
          </button>
        )}
        <div style={{ fontSize: 10, color: 'rgba(139,148,158,0.6)', textAlign: 'center', lineHeight: 1.5 }}>
          La foto se convierte en un vector numérico y no se almacena como imagen.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}