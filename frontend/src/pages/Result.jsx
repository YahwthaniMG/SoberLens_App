// frontend/src/pages/Result.jsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Result() {
  const navigate = useNavigate()
  const location = useLocation()

  const result = location.state?.result
  const [showDetails, setShowDetails] = useState(false)

  if (!result) {
    navigate('/dashboard')
    return null
  }

  const isDrunk       = result.result === 'drunk'
  const isCaution     = result.result === 'caution'
  const isInconclusive = result.result === 'inconclusive'
  const isSober       = result.result === 'sober'
  const pct           = Math.round(result.drunk_ratio * 100)

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
    ? 'No apto'
    : isCaution
    ? 'Precaucion'
    : isInconclusive
    ? 'Inconcluso'
    : 'Acceso permitido'

  const resultDesc = isDrunk
    ? 'Se detectaron signos de posible no aptitud. Tu supervisor ha sido notificado y realizara una verificacion presencial.'
    : isCaution
    ? 'El sistema detecto una señal leve. Tu supervisor ha sido notificado para una verificacion presencial de seguimiento.'
    : isInconclusive
    ? 'No se pudieron analizar suficientes frames. Intenta de nuevo.'
    : 'No se detectaron signos de no aptitud. Que tengas un buen turno.'

  const needsSecondVerification = isDrunk || isCaution

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <div style={{ width: 40 }} />
        <span style={{ fontSize: 11 }}>Resultado</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Hero */}
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

        <div style={{
          fontSize: 34, fontWeight: 800, color: accentColor,
          letterSpacing: -1, marginBottom: 8,
        }}>
          {resultLabel}
        </div>
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6, maxWidth: 280,
        }}>
          {resultDesc}
        </div>

        <div style={{
          marginTop: 24, background: 'rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '14px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            fontSize: 36, fontWeight: 900, color: accentColor, letterSpacing: -1,
          }}>
            {pct}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            indice de deteccion
          </div>
        </div>
      </div>

      {/* Banner de segunda verificacion */}
      {needsSecondVerification && (
        <div style={{
          margin: '16px 20px 0',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--amber)" strokeWidth="2" strokeLinecap="round"
            style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2L2 22h20L12 2zM12 9v5M12 17v2"/>
          </svg>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            Tu supervisor realizara una verificacion presencial antes de tomar
            cualquier decision. Presentate con el en tu area de trabajo.
          </div>
        </div>
      )}

      {/* Detalles expandibles */}
      {showDetails && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: 'var(--dark2)', borderRadius: 16,
            border: '1px solid var(--dark3)', padding: 16,
            display: 'flex', gap: 12,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)' }}>
                {result.drunk_votes}
              </div>
              <div style={{ fontSize: 10, color: 'var(--g1)' }}>No apto</div>
            </div>
            <div style={{ width: 1, background: 'var(--dark3)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--teal)' }}>
                {result.sober_votes}
              </div>
              <div style={{ fontSize: 10, color: 'var(--g1)' }}>Apto</div>
            </div>
            <div style={{ width: 1, background: 'var(--dark3)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--g2)' }}>
                {result.analyzed_frames}
              </div>
              <div style={{ fontSize: 10, color: 'var(--g1)' }}>Analizados</div>
            </div>
          </div>

          {result.frame_results && result.frame_results.length > 0 && (
            <div style={{
              background: 'var(--dark2)', borderRadius: 16,
              border: '1px solid var(--dark3)', padding: 16,
            }}>
              <div style={{
                fontSize: 10, color: 'var(--g1)', marginBottom: 10,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
              }}>
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
              <div style={{
                marginTop: 8, display: 'flex', gap: 12,
                fontSize: 9, color: 'var(--g1)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--teal)' }} />
                  Apto
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red)' }} />
                  No apto
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--dark3)' }} />
                  Sin cara
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '16px 28px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isInconclusive && (
          <button
            onClick={() => navigate('/capture')}
            style={{
              background: 'var(--teal)', color: 'var(--dark)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
            }}
          >
            Intentar de nuevo
          </button>
        )}

        <button
          onClick={() => setShowDetails(v => !v)}
          style={{
            background: 'var(--dark2)', border: '1px solid var(--dark3)',
            borderRadius: 14, padding: 14, color: 'var(--g1)',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', width: '100%',
          }}
        >
          {showDetails ? 'Ocultar detalles' : 'Ver detalles del resultado'}
        </button>

        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}