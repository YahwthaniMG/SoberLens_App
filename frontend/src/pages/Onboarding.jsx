import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useUserStore from '../store/userStore'

function useRealTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

export default function Onboarding() {
  const navigate = useNavigate()
  const now = useRealTime()
  const { consentProcessing, faceRegistered, switchToNewProfile } = useUserStore()
  const hasAccount = consentProcessing && faceRegistered

  useEffect(() => {
    if (hasAccount) navigate('/dashboard', { replace: true })
  }, [])

  if (hasAccount) return null

  function handleNewUser() {
    if (consentProcessing || faceRegistered) switchToNewProfile()
    navigate('/consent')
  }

  function handleExistingAccount() {
    navigate('/register')
  }

  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <span style={{ fontFamily: 'var(--mono)' }}>{timeStr}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="12" height="9" viewBox="0 0 12 9" fill="var(--g1)">
            <rect x="0" y="3" width="2" height="6" rx="1"/>
            <rect x="3" y="2" width="2" height="7" rx="1"/>
            <rect x="6" y="1" width="2" height="8" rx="1"/>
            <rect x="9" y="0" width="2" height="9" rx="1"/>
          </svg>
          <svg width="22" height="9" viewBox="0 0 22 9" fill="none">
            <rect x=".5" y=".5" width="18" height="8" rx="2" stroke="var(--g1)"/>
            <rect x="1.5" y="1.5" width="12" height="6" rx="1" fill="var(--g1)"/>
            <path d="M20 3v3a1.5 1.5 0 000-3z" fill="var(--g1)"/>
          </svg>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 28px 0', textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, var(--teal), var(--teal-d))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, marginTop: 8,
          boxShadow: '0 12px 32px rgba(0,201,167,.35)',
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="20" cy="14" r="7"/>
            <path d="M10 34v-3A10 10 0 0130 31v3"/>
            <path d="M26 22l3 3 6-6" stroke="#7DFFDE" strokeWidth="2.5"/>
          </svg>
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--white)', letterSpacing: -1, marginBottom: 6 }}>
          Sober<span style={{ color: 'var(--teal)' }}>Lens</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6, maxWidth: 240, marginBottom: 32 }}>
          Monitoreo inteligente para que disfrutes con seguridad
        </div>

        <div style={{ width: '100%', marginBottom: 24 }}>
          {[
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                  stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="9" cy="6" r="3"/>
                  <path d="M4 15v-2a5 5 0 0110 0v2"/>
                </svg>
              ),
              title: 'Registra tu perfil',
              desc: 'Foto de referencia en estado sobrio',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                  stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 9h12M9 3v12"/>
                </svg>
              ),
              title: 'Define tu contacto',
              desc: 'Quién recibe la alerta si detectamos un problema',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                  stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="2" y="2" width="14" height="14" rx="3"/>
                  <path d="M6 9l2.5 2.5 4-4"/>
                </svg>
              ),
              title: 'Activa al salir',
              desc: 'SoberLens monitorea y te avisa si detecta algo',
            },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '12px 0',
              borderBottom: i < 2 ? '1px solid var(--dark3)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--dark3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {step.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 2 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--g1)', lineHeight: 1.4 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={handleNewUser}>
          Comenzar configuración
        </button>
        <button className="btn-ghost" onClick={handleExistingAccount}>
          Ya tengo cuenta — registrar en este dispositivo
        </button>
      </div>
    </div>
  )
}