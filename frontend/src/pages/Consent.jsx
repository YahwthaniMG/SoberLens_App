import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'

export default function Consent() {
  const navigate = useNavigate()
  const setConsent = useUserStore(s => s.setConsent)

  const [processing, setProcessing] = useState(false)
  const [retraining, setRetraining] = useState(false)

  function handleContinue() {
    setConsent(processing, retraining)
    navigate('/profile')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          ← Atrás
        </button>
      </div>

      {/* Body */}
      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 20,
        overflowY: 'auto',
      }}>
        {/* Icono */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--dark3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
            stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2a12 12 0 100 24A12 12 0 0014 2z"/>
            <path d="M14 10v4l3 3"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5, lineHeight: 1.3, marginBottom: 8 }}>
            Antes de empezar,<br />necesitamos tu permiso
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            SoberLens procesa imágenes de tu rostro para detectar signos de intoxicación. Lee con atención antes de continuar.
          </div>
        </div>

        {/* Tarjeta de consentimientos */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Checkbox obligatorio */}
          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
            <div
              onClick={() => setProcessing(v => !v)}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: processing ? 'var(--teal)' : 'transparent',
                border: `2px solid ${processing ? 'var(--teal)' : 'var(--g1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {processing && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="var(--dark)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 6l3 3 5-5"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>
                Procesamiento de imágenes
                <span style={{
                  marginLeft: 8, fontSize: 10, background: 'rgba(0,201,167,.15)',
                  color: 'var(--teal)', borderRadius: 6, padding: '2px 8px', fontWeight: 600,
                }}>
                  Requerido
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--g1)', lineHeight: 1.5 }}>
                Acepto que mis frames faciales sean enviados al servidor, procesados para extraer características biométricas y eliminados inmediatamente. No se almacenan imágenes.
              </div>
            </div>
          </label>

          <div style={{ height: 1, background: 'var(--dark3)' }} />

          {/* Checkbox opcional */}
          <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
            <div
              onClick={() => setRetraining(v => !v)}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: retraining ? 'var(--teal)' : 'transparent',
                border: `2px solid ${retraining ? 'var(--teal)' : 'var(--g1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {retraining && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="var(--dark)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 6l3 3 5-5"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>
                Contribuir al modelo
                <span style={{
                  marginLeft: 8, fontSize: 10, background: 'var(--dark3)',
                  color: 'var(--g1)', borderRadius: 6, padding: '2px 8px', fontWeight: 600,
                }}>
                  Opcional
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--g1)', lineHeight: 1.5 }}>
                Acepto que mis sesiones anonimizadas (sin imágenes, solo métricas) puedan usarse para mejorar el modelo de detección. Puedo revocar esto desde Ajustes en cualquier momento.
              </div>
            </div>
          </label>
        </div>

        {/* Nota de privacidad */}
        <div style={{
          background: 'var(--dark3)', borderRadius: 12, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="var(--g1)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 7v4M8 5.5v.5"/>
          </svg>
          <div style={{ fontSize: 11, color: 'var(--g1)', lineHeight: 1.5 }}>
            Tu embedding facial se guarda como vector numérico, no como foto. No es posible reconstruir tu imagen a partir de él.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 28px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={!processing}
        >
          Continuar
        </button>
        {!processing && (
          <div style={{ fontSize: 11, color: 'var(--g1)', textAlign: 'center' }}>
            El consentimiento de procesamiento es obligatorio para usar la app.
          </div>
        )}
      </div>
    </div>
  )
}