import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startCamera, stopCamera, capturePhoto } from '../services/camera'
import { recoverAccount } from '../services/api'
import useUserStore from '../store/userStore'

export default function DeviceRecovery() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const { setProfile, setFaceRegistered, setConsent, setEmergencyContact } = useUserStore()

  const [status, setStatus] = useState('init')   // init | ready | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [foundUser, setFoundUser] = useState(null)

  useEffect(() => {
    startCamera(videoRef.current)
      .then(s => {
        streamRef.current = s
        setStatus('ready')
      })
      .catch(() => {
        setErrorMsg('No se pudo acceder a la camara. Verifica los permisos.')
        setStatus('error')
      })
    return () => stopCamera(streamRef.current)
  }, [])

  async function handleScan() {
    setStatus('scanning')
    setErrorMsg('')
    try {
      const photo = await capturePhoto(videoRef.current)
      const result = await recoverAccount(photo)
      setFoundUser(result)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'No se encontro ninguna cuenta con ese rostro.')
      setStatus('error')
    }
  }

  function handleConfirmRecovery() {
    if (!foundUser) return

    // Adoptar el device_id del usuario encontrado
    localStorage.setItem('soberlens_device_id', foundUser.device_id)

    // Restaurar datos en el store y localStorage con la clave correcta
    const id = foundUser.device_id
    if (foundUser.name) {
      localStorage.setItem(`soberlens_name_${id}`, foundUser.name)
    }
    if (foundUser.age_range) {
      localStorage.setItem(`soberlens_age_${id}`, foundUser.age_range)
    }
    if (foundUser.emergency_contact) {
      localStorage.setItem(`soberlens_contact_${id}`, foundUser.emergency_contact)
      setEmergencyContact(foundUser.emergency_contact)
    }

    // Marcar consentimiento y face como completados para saltarse el onboarding
    localStorage.setItem(
      `soberlens_consent_${id}`,
      JSON.stringify({ processing: true, retraining: false })
    )
    localStorage.setItem(`soberlens_face_${id}`, 'true')

    // Actualizar el store
    setConsent(true, false)
    setFaceRegistered(true)
    if (foundUser.name || foundUser.age_range) {
      setProfile(foundUser.name || '', foundUser.age_range || '')
    }

    stopCamera(streamRef.current)
    navigate('/dashboard', { replace: true })
  }

  function handleRetry() {
    setErrorMsg('')
    setFoundUser(null)
    setStatus('ready')
  }

  const isScanning = status === 'scanning'

  return (
    <div className="screen" style={{ background: 'var(--dark)', position: 'relative' }}>
      {/* Header */}
      <div className="status-bar" style={{ color: 'var(--g1)', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Recuperar cuenta</span>
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
          background: 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.7) 100%)',
        }} />

        {/* Ovalo guia */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: 150, height: 190, borderRadius: '50%',
          border: `2.5px solid ${
            status === 'error' ? 'var(--red)' :
            status === 'success' ? 'var(--teal)' :
            'rgba(255,255,255,0.5)'
          }`,
          boxShadow: '0 0 0 2000px rgba(0,0,0,.35)',
          transition: 'border-color 0.3s',
        }}>
          {isScanning && (
            <div style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--teal)', borderRightColor: 'var(--teal)',
              animation: 'spin 1.2s linear infinite',
            }} />
          )}
        </div>

        {/* Mensaje en overlay */}
        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '8px 20px',
            fontSize: 13, color: 'white', fontWeight: 500,
          }}>
            {status === 'init' && 'Iniciando camara...'}
            {status === 'ready' && 'Centra tu rostro y presiona el boton'}
            {status === 'scanning' && 'Buscando tu cuenta...'}
            {status === 'success' && `Cuenta encontrada — ${(foundUser.similarity * 100).toFixed(0)}% similitud`}
            {status === 'error' && 'No se encontro la cuenta'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px 40px', background: 'var(--dark)' }}>
        {status === 'success' && foundUser ? (
          <>
            <div style={{
              marginBottom: 12, padding: '12px 14px',
              background: 'rgba(0,201,167,0.08)', borderRadius: 12,
              border: '1px solid rgba(0,201,167,0.25)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600, marginBottom: 4 }}>
                Cuenta encontrada
              </div>
              {foundUser.name && (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', marginBottom: 2 }}>
                  {foundUser.name}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                {foundUser.age_range && `${foundUser.age_range} anos · `}
                {foundUser.emergency_contact
                  ? `Contacto: ${foundUser.emergency_contact_name || foundUser.emergency_contact}`
                  : 'Sin contacto configurado'}
              </div>
            </div>
            <button className="btn-primary" onClick={handleConfirmRecovery}>
              Continuar con esta cuenta
            </button>
            <button
              onClick={handleRetry}
              style={{
                marginTop: 10, width: '100%', background: 'none',
                border: '1px solid var(--dark3)', borderRadius: 14, padding: 14,
                color: 'var(--g1)', fontSize: 13, cursor: 'pointer',
              }}
            >
              No soy yo — intentar de nuevo
            </button>
          </>
        ) : status === 'error' ? (
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
              Intentar de nuevo
            </button>
            <button
              onClick={() => navigate('/consent')}
              style={{
                marginTop: 10, width: '100%', background: 'none',
                border: '1px solid var(--dark3)', borderRadius: 14, padding: 14,
                color: 'var(--g1)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Crear cuenta nueva
            </button>
          </>
        ) : (
          <button
            className="btn-primary"
            onClick={handleScan}
            disabled={status !== 'ready'}
            style={{ opacity: status === 'ready' ? 1 : 0.5 }}
          >
            {isScanning ? 'Buscando...' : 'Escanear rostro'}
          </button>
        )}
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--g1)', textAlign: 'center' }}>
          Tu rostro se compara contra las cuentas registradas en este servidor
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}