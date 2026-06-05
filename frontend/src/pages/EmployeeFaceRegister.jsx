// frontend/src/pages/EmployeeFaceRegister.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { registerEmployeeFace } from '../services/api'
import { startCamera, stopCamera, capturePhoto } from '../services/camera'

const STEPS = [
  { label: 'Mira directo a la camara' },
  { label: 'Gira levemente a la derecha' },
  { label: 'Gira levemente a la izquierda' },
]

export default function EmployeeFaceRegister() {
  const navigate = useNavigate()
  const { workerName, setFaceRegistered } = useUserStore()

  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const [step, setStep]       = useState(0)
  const [status, setStatus]   = useState('idle')
  const [error, setError]     = useState('')
  const [captures, setCaptures] = useState([])

  useEffect(() => {
    startCamera(videoRef.current, streamRef)
      .catch(() => setError('No se pudo acceder a la camara. Verifica los permisos.'))
    return () => stopCamera(streamRef.current)
  }, [])

  async function handleCapture() {
    setError('')
    try {
      const photo = await capturePhoto(videoRef.current)
      const next  = [...captures, photo]
      setCaptures(next)

      if (step < STEPS.length - 1) {
        setStep(step + 1)
      } else {
        await handleRegister(next)
      }
    } catch {
      setError('Error al capturar la imagen.')
    }
  }

  async function handleRegister(photos) {
    setStatus('registering')
    try {
      // Usamos la primera foto como embedding de referencia
      await registerEmployeeFace(photos[0])
      setFaceRegistered(true)
      stopCamera(streamRef.current)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'No se pudo registrar el rostro. Intenta de nuevo.')
      setStatus('idle')
      setStep(0)
      setCaptures([])
    }
  }

  const isRegistering = status === 'registering'

  return (
    <div className="screen" style={{ background: 'var(--dark)', position: 'relative' }}>
      <div className="status-bar" style={{ color: 'var(--g1)', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/verify-id')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Atras
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Registro facial</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Camara */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,.75) 100%)',
        }} />

        {/* Ovalo guia */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '72vw', height: '58vh',
          border: '2.5px solid var(--teal)',
          boxShadow: '0 0 0 2000px rgba(0,0,0,0.45)',
        }} />

        {/* Instruccion del paso actual */}
        {!isRegistering && (
          <div style={{
            position: 'absolute', bottom: 180, left: 0, right: 0,
            textAlign: 'center', padding: '0 24px',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)' }}>
              {STEPS[step].label}
            </div>
          </div>
        )}

        {isRegistering && (
          <div style={{
            position: 'absolute', bottom: 180, left: 0, right: 0,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: 'var(--teal)' }}>Registrando rostro...</div>
          </div>
        )}
      </div>

      {/* Panel inferior */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 28px 40px',
        display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
      }}>
        {/* Indicador de pasos */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i < step ? 'var(--teal)' : i === step ? 'var(--teal)' : 'var(--dark3)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {workerName && (
          <div style={{ fontSize: 13, color: 'var(--g1)' }}>
            Registrando a <span style={{ color: 'var(--white)', fontWeight: 600 }}>
              {workerName}
            </span>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{error}</div>
        )}

        <button
          onClick={handleCapture}
          disabled={isRegistering}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: isRegistering ? 'var(--dark3)' : 'var(--teal)',
            border: '4px solid rgba(255,255,255,0.2)',
            cursor: isRegistering ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: isRegistering ? 'var(--g1)' : 'var(--dark)',
          }} />
        </button>

        <div style={{ fontSize: 11, color: 'var(--g1)', textAlign: 'center' }}>
          Paso {step + 1} de {STEPS.length}
        </div>
      </div>
    </div>
  )
}