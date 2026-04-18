import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useUserStore from '../store/userStore'
import { sendAlert } from '../services/api'

export default function Alert() {
  const navigate = useNavigate()
  const location = useLocation()
  const { emergencyContact } = useUserStore()

  const result = location.state?.result
  const [alertSent, setAlertSent] = useState(false)
  const [alertLoading, setAlertLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!result || dismissed) {
    navigate('/dashboard')
    return null
  }

  const pct = Math.round(result.drunk_ratio * 100)

  async function handleSendAlert() {
    setAlertLoading(true)
    try {
      await sendAlert(result.session_id, emergencyContact)
      setAlertSent(true)
    } catch {
      // no bloqueamos el flujo si falla
    } finally {
      setAlertLoading(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <div style={{ width: 40 }} />
        <span style={{ fontSize: 11 }}>Alerta</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Hero alerta */}
      <div style={{
        padding: '28px 28px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(248,81,73,0.12) 0%, transparent 100%)',
      }}>
        {/* Icono pulsante */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            position: 'absolute', inset: -12, borderRadius: '50%',
            background: 'rgba(248,81,73,0.15)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(248,81,73,0.2)',
            border: '2px solid var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
              stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M16 4l12 22H4L16 4z"/>
              <path d="M16 14v5M16 22v1"/>
            </svg>
          </div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--red)', letterSpacing: -0.5, marginBottom: 8 }}>
          Intoxicación detectada
        </div>
        <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6, maxWidth: 260 }}>
          El análisis detectó signos de intoxicación. Considera no conducir y avisa a alguien de confianza.
        </div>
      </div>

      {/* Info de sesion */}
      <div style={{
        margin: '0 20px', background: 'var(--dark2)', borderRadius: 16,
        border: '1px solid var(--dark3)', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[
          { label: 'Resultado', val: 'Ebrio', color: 'var(--red)' },
          { label: 'Ratio de intoxicación', val: `${pct}%`, color: 'var(--red)' },
          { label: 'Frames analizados', val: `${result.analyzed_frames} / ${result.total_frames}`, color: 'var(--g2)' },
          { label: 'Votos ebrio', val: `${result.drunk_votes}`, color: 'var(--red)' },
        ].map((row, i, arr) => (
          <div key={i}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 11, color: 'var(--g1)' }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.val}</span>
            </div>
            {i < arr.length - 1 && (
              <div style={{ height: 1, background: 'var(--dark3)', marginTop: 10 }} />
            )}
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ padding: '16px 20px 40px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!alertSent ? (
          <button
            onClick={handleSendAlert}
            disabled={alertLoading || !emergencyContact}
            style={{
              width: '100%', padding: 16, border: 'none', borderRadius: 16,
              background: emergencyContact ? 'var(--red)' : 'var(--dark3)',
              color: emergencyContact ? 'white' : 'var(--g1)',
              fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
              cursor: emergencyContact ? 'pointer' : 'not-allowed',
              opacity: alertLoading ? 0.7 : 1,
            }}
          >
            {alertLoading
              ? 'Enviando...'
              : emergencyContact
              ? `Alertar a ${emergencyContact}`
              : 'No hay contacto configurado'}
          </button>
        ) : (
          <div style={{
            padding: '12px 16px', background: 'rgba(37,211,102,.12)',
            border: '1px solid rgba(37,211,102,.3)', borderRadius: 12,
            fontSize: 12, color: '#25D366', textAlign: 'center',
          }}>
            SMS enviado a {emergencyContact}
          </div>
        )}

        <button
          className="btn-outline"
          onClick={() => navigate('/result', { state: { result } })}
        >
          Ver detalle del resultado
        </button>

        <button
          className="btn-ghost"
          onClick={() => setDismissed(true)}
        >
          Descartar alerta
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}