import { useLocation, useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { sendAlert } from '../services/api'
import { useState } from 'react'

export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const { emergencyContact } = useUserStore()

  const result = location.state?.result
  const [alertSent, setAlertSent] = useState(false)
  const [alertLoading, setAlertLoading] = useState(false)

  // Si no hay resultado (navegacion directa), redirigir
  if (!result) {
    navigate('/dashboard')
    return null
  }

  const isDrunk = result.result === 'drunk'
  const isInconclusive = result.result === 'inconclusive'
  const pct = Math.round(result.drunk_ratio * 100)

  const accentColor = isDrunk ? 'var(--red)' : isInconclusive ? 'var(--amber)' : 'var(--teal)'
  const bgGradient = isDrunk
    ? 'linear-gradient(135deg, #2D1117, #0D1117)'
    : isInconclusive
    ? 'linear-gradient(135deg, #1A1500, #0D1117)'
    : 'linear-gradient(135deg, #0D2117, #0D1117)'

  const resultLabel = isDrunk ? 'Ebrio' : isInconclusive ? 'Inconcluso' : 'Sobrio'
  const resultDesc = isDrunk
    ? 'Se detectaron signos de intoxicación en la mayoría de los frames.'
    : isInconclusive
    ? 'No se pudieron analizar suficientes frames. Intenta de nuevo.'
    : 'No se detectaron signos significativos de intoxicación.'

  async function handleSendAlert() {
    setAlertLoading(true)
    try {
      await sendAlert(result.session_id, emergencyContact)
      setAlertSent(true)
    } catch {
      // Si falla el alert, no bloqueamos el flujo
    } finally {
      setAlertLoading(false)
    }
  }

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <div style={{ width: 40 }} />
        <span style={{ fontSize: 11 }}>Resultado</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Hero resultado */}
      <div style={{
        background: bgGradient,
        padding: '32px 28px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Icono */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${accentColor}18`,
          border: `2px solid ${accentColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          boxShadow: `0 0 32px ${accentColor}40`,
        }}>
          {isDrunk ? (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
              stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="18" r="14"/>
              <path d="M18 10v8M18 24v1"/>
            </svg>
          ) : isInconclusive ? (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
              stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="18" r="14"/>
              <path d="M18 10v8M18 24v1"/>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
              stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="18" cy="18" r="14"/>
              <path d="M11 18l5 5 9-9"/>
            </svg>
          )}
        </div>

        <div style={{ fontSize: 36, fontWeight: 800, color: accentColor, letterSpacing: -1, marginBottom: 8 }}>
          {resultLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6, maxWidth: 260 }}>
          {resultDesc}
        </div>
      </div>

      {/* Metricas */}
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Probabilidad principal */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--g1)' }}>Ratio de intoxicación</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--dark3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: accentColor, borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Votos */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', padding: 16,
          display: 'flex', gap: 12,
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>{result.drunk_votes}</div>
            <div style={{ fontSize: 10, color: 'var(--g1)' }}>Ebrio</div>
          </div>
          <div style={{ width: 1, background: 'var(--dark3)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--teal)' }}>{result.sober_votes}</div>
            <div style={{ fontSize: 10, color: 'var(--g1)' }}>Sobrio</div>
          </div>
          <div style={{ width: 1, background: 'var(--dark3)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--g2)' }}>{result.analyzed_frames}</div>
            <div style={{ fontSize: 10, color: 'var(--g1)' }}>Analizados</div>
          </div>
        </div>

        {/* Votos por frame */}
        {result.frame_results && result.frame_results.length > 0 && (
          <div style={{
            background: 'var(--dark2)', borderRadius: 16,
            border: '1px solid var(--dark3)', padding: 16,
          }}>
            <div style={{ fontSize: 10, color: 'var(--g1)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Votos por frame
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {result.frame_results.map((f, i) => (
                <div key={i} style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: !f.face_detected
                    ? 'var(--dark3)'
                    : f.prediction === 'drunk'
                    ? 'var(--red)'
                    : 'var(--teal)',
                  title: f.drunk_probability
                    ? `${(f.drunk_probability * 100).toFixed(0)}%`
                    : 'Sin cara',
                }} />
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 9, color: 'var(--g1)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--teal)' }} /> Sobrio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} /> Ebrio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--dark3)' }} /> Sin cara
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 28px 40px', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        {isDrunk && !alertSent && emergencyContact && (
          <button
            onClick={handleSendAlert}
            disabled={alertLoading}
            style={{
              width: '100%', background: '#25D366', color: 'white',
              borderRadius: 16, padding: 16, border: 'none',
              fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700,
              cursor: alertLoading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: alertLoading ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
              <path d="M9 0C4 0 0 4 0 9c0 1.6.4 3.1 1.2 4.4L0 18l4.7-1.2C6 17.6 7.5 18 9 18c5 0 9-4 9-9s-4-9-9-9zm4.5 12.5c-.2.5-.9.9-1.5 1-.4 0-.9.1-2.7-.6-2.3-.8-3.8-3.2-3.9-3.3-.2-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.2.4.8 1.2 1.5 1.8.7.6 1.4.9 1.8 1 .2.1.4 0 .5-.1l.4-.5c.1-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .1 0 .3-.1.4z"/>
            </svg>
            {alertLoading ? 'Enviando...' : 'Alertar por WhatsApp'}
          </button>
        )}

        {alertSent && (
          <div style={{
            padding: '12px 16px', background: 'rgba(37,211,102,.12)',
            border: '1px solid rgba(37,211,102,.3)', borderRadius: 12,
            fontSize: 12, color: '#25D366', textAlign: 'center',
          }}>
            Alerta enviada a {emergencyContact}
          </div>
        )}

        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}