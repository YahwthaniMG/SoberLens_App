// frontend/src/pages/EmployeeDeviceRecovery.jsx
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { startCamera, stopCamera, capturePhoto } from '../services/camera'
import { verifyWorkerId, recoverEmployeeDevice } from '../services/api'

export default function EmployeeDeviceRecovery() {
  const navigate = useNavigate()
  const location = useLocation()
  const { companyId, companyName, setEmployeeProfile, setFaceRegistered, setConsentGiven } = useUserStore()

  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const workerId = location.state?.workerId
  const [status, setStatus]   = useState('idle')
  const [error, setError]     = useState('')
  const [employeeData, setEmployeeData] = useState(null)

  useEffect(() => {
    if (!workerId) { navigate('/verify-id'); return }
    startCamera(videoRef.current)
      .then(s => { streamRef.current = s })
      .catch(() => setError('No se pudo acceder a la camara.'))
    return () => stopCamera(streamRef.current)
  }, [])

  async function handleRecover() {
    setStatus('recovering')
    setError('')
    try {
      // Primero obtener el employee_id del worker_id
      const empData = await verifyWorkerId(workerId, Number(companyId), true)
      const photo = await capturePhoto(videoRef.current)
      const result = await recoverEmployeeDevice(
        photo,
        empData.employee_id,
        Number(companyId),
      )
      stopCamera(streamRef.current)
      // Actualizar store con los datos del empleado recuperado
      setEmployeeProfile(
        empData.employee_id,
        workerId,
        empData.name,
        empData.area || '',
        empData.shift || '',
      )
      setFaceRegistered(true)
      setConsentGiven(true)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'No se pudo verificar tu identidad.')
      setStatus('idle')
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)', position: 'relative' }}>
      <div className="status-bar" style={{ color: 'rgba(255,255,255,.5)',
        position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/verify-id')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
          Recuperar acceso
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
          border: '2.5px solid var(--amber)',
          boxShadow: '0 0 0 2000px rgba(0,0,0,.35)',
        }} />

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
            {status === 'recovering' ? 'Verificando identidad...' : 'Mira directo a la camara'}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 28px 40px', background: 'var(--dark)' }}>
        {error && (
          <div style={{
            marginBottom: 12, padding: '10px 14px',
            background: 'rgba(248,81,73,.12)', borderRadius: 10,
            border: '1px solid rgba(248,81,73,.3)',
            fontSize: 12, color: 'var(--red)', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleRecover}
          disabled={status === 'recovering'}
          style={{
            background: status === 'recovering' ? 'var(--dark3)' : 'var(--amber)',
            color: 'var(--dark)', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 15, fontWeight: 700,
            cursor: status === 'recovering' ? 'wait' : 'pointer', width: '100%',
          }}
        >
          {status === 'recovering' ? 'Verificando...' : 'Verificar mi identidad'}
        </button>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--g1)', textAlign: 'center' }}>
          El sistema comparara tu rostro con el que registraste al crear tu cuenta
        </div>
      </div>
    </div>
  )
}