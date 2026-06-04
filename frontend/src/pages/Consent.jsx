// frontend/src/pages/Consent.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'

export default function Consent() {
  const navigate = useNavigate()
  const { setConsentGiven } = useUserStore()

  const [accepted, setAccepted] = useState(false)

  function handleContinue() {
    setConsentGiven(true)
    navigate('/register-face')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/register-face')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Atras
        </button>
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--dark3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
            stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2a12 12 0 100 24A12 12 0 0014 2z" />
            <path d="M14 10v4l3 3" />
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, lineHeight: 1.3, marginBottom: 8 }}>
            Terminos de uso laboral
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            SoberLens analiza tu rostro para verificar aptitud antes de cada turno.
            Lee con atencion antes de continuar.
          </div>
        </div>

        <div style={{
          background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {[
            {
              title: 'Que se analiza',
              body: 'La app captura 18 imagenes de tu rostro en 5 segundos. Se procesan en tiempo real y se eliminan inmediatamente. Solo se guarda el resultado de la verificacion.',
            },
            {
              title: 'Para que se usa',
              body: 'El resultado se reporta a tu empresa unicamente cuando el sistema detecta una posible no aptitud. Las verificaciones aptas no generan ninguna notificacion.',
            },
            {
              title: 'Segunda verificacion',
              body: 'Si el resultado es no apto, tu supervisor realizara una verificacion presencial antes de tomar cualquier decision. La app no es determinante por si sola.',
            },
            {
              title: 'Tus datos',
              body: 'Tu embedding facial (un vector numerico) se almacena de forma segura para verificar tu identidad. No se comparte con terceros ni permite reconstruir tu imagen.',
            },
          ].map(item => (
            <div key={item.title}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)',
                marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.6 }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox obligatorio */}
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
          cursor: 'pointer' }}>
          <div
            onClick={() => setAccepted(v => !v)}
            style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: accepted ? 'var(--teal)' : 'transparent',
              border: `2px solid ${accepted ? 'var(--teal)' : 'var(--dark3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {accepted && (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                stroke="var(--dark)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 6.5l3 3 6-6" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.5 }}>
            Entiendo y acepto que mi empresa reciba notificaciones cuando el sistema
            detecte una posible no aptitud para trabajar.
          </div>
        </label>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleContinue}
            disabled={!accepted}
            style={{
              background: accepted ? 'var(--teal)' : 'var(--dark3)',
              color: accepted ? 'var(--dark)' : 'var(--g1)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 15, fontWeight: 700,
              cursor: accepted ? 'pointer' : 'default', width: '100%',
            }}
          >
            Aceptar y continuar
          </button>
        </div>
      </div>
    </div>
  )
}