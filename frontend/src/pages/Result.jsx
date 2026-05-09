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
  const [showDetails, setShowDetails] = useState(false)

  if (!result) {
    navigate('/dashboard')
    return null
  }

  const isDrunk = result.result === 'drunk'
  const isCaution = result.result === 'caution'
  const isInconclusive = result.result === 'inconclusive'
  const isSober = result.result === 'sober'
  const pct = Math.round(result.drunk_ratio * 100)

  const accentColor = isDrunk
    ? 'var(--red)'
    : isCaution
    ? 'var(--amber)'
    : isInconclusive
    ? 'var(--g1)'
    : 'var(--teal)'

  const bgGradient = isDrunk
    ? 'linear-gradient(135deg, #2D1117, #0D1117)'
    : isCaution
    ? 'linear-gradient(135deg, #1A1200, #0D1117)'
    : isInconclusive
    ? 'linear-gradient(135deg, #161B22, #0D1117)'
    : 'linear-gradient(135deg, #0D2117, #0D1117)'

  const resultLabel = isDrunk
    ? 'Ebrio'
    : isCaution
    ? 'Precaucion'
    : isInconclusive
    ? 'Inconcluso'
    : 'Sobrio'

  const resultDesc = isDrunk
    ? 'Se detectaron signos claros de intoxicacion en la mayoria de los frames.'
    : isCaution
    ? 'Si has consumido alcohol esta empezando a hacer efecto. De lo contrario, podrias estar bajo un estado de agotamiento.'
    : isInconclusive
    ? 'No se pudieron analizar suficientes frames. Intenta de nuevo.'
    : 'No se detectaron signos significativos de intoxicacion.'

  async function handleSendAlert() {
    setAlertLoading(true)
    try {
      await sendAlert(result.session_id, emergencyContact)
      setAlertSent(true)
    } catch {
      // no bloqueamos el flujo
    } finally {
      setAlertLoading(false)
    }
  }

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <div style={{ width: 40 }} />
        <span style={{ fontSize: 11 }}>Resultado</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Hero resultado — identico para todos los estados */}
      <div style={{
        background: bgGradient,
        padding: '32px 28px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${accentColor}18`,
          border: `2px solid ${accentColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          boxShadow: `0 0 32px ${accentColor}40`,
        }}>
          {isDrunk ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
              stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M16 10v8M16 22v2"/>
              <circle cx="16" cy="16" r="13"/>
            </svg>
          ) : isCaution ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
              stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M16 6L3 27h26L16 6zM16 14v6M16 23v2"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
              stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 16l6 6 10-10"/>
              <circle cx="16" cy="16" r="13"/>
            </svg>
          )}
        </div>

        <div style={{ fontSize: 34, fontWeight: 800, color: accentColor, letterSpacing: -1, marginBottom: 8 }}>
          {resultLabel}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 280 }}>
          {resultDesc}
        </div>

        {/* Porcentaje — unico dato visible sin abrir detalles */}
        <div style={{
          marginTop: 24, background: 'rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '14px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: accentColor, letterSpacing: -1 }}>
            {pct}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            ratio de intoxicacion
          </div>
        </div>
      </div>

      {/* Detalles expandibles — solo se muestran si el usuario los pide */}
      {showDetails && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Contadores */}
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
      )}

      {/* Footer */}
      <div style={{ padding: '8px 28px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {/* Ver/ocultar detalles */}
        <button
          onClick={() => setShowDetails(v => !v)}
          style={{
            background: 'var(--dark2)', border: '1px solid var(--dark3)',
            borderRadius: 16, padding: 14, color: 'var(--g1)',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles del resultado'}
        </button>

        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}