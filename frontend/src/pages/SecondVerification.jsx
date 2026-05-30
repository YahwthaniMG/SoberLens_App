// frontend/src/pages/SecondVerification.jsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { secondVerify } from '../services/api'

export default function SecondVerification() {
  const navigate      = useNavigate()
  const { id }        = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [finalResult, setFinalResult] = useState('')

  async function handleVerify(result) {
    setLoading(true)
    setError('')
    try {
      await secondVerify(id, result)
      setFinalResult(result)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Error al registrar la verificacion.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const confirmed = finalResult === 'confirmed'
    return (
      <div className="screen" style={{ background: 'var(--dark)',
        justifyContent: 'center', alignItems: 'center' }}>
        <div className="fade-up" style={{
          padding: '0 28px', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: confirmed ? 'rgba(239,68,68,0.12)' : 'rgba(0,201,167,0.12)',
            border: `2px solid ${confirmed ? 'var(--red)' : 'var(--teal)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {confirmed ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 8v5M12 16v1"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
              letterSpacing: -0.5, marginBottom: 8 }}>
              {confirmed ? 'No apto confirmado' : 'Falso positivo registrado'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
              {confirmed
                ? 'El resultado queda registrado. El empleado no tiene acceso permitido para este turno.'
                : 'El resultado se corrigio. El empleado tiene acceso permitido para este turno.'}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              background: 'var(--teal)', color: 'var(--dark)',
              border: 'none', borderRadius: 14, padding: '16px 32px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Volver al panel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Segunda verificacion</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px 40px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 8 }}>
            Verificacion presencial
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            Tras realizar la verificacion presencial con alcoholimetro u otro metodo,
            registra el resultado definitivo.
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Confirmar no apto */}
          <button
            onClick={() => handleVerify('confirmed')}
            disabled={loading}
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1.5px solid rgba(239,68,68,0.3)',
              borderRadius: 16, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: loading ? 'wait' : 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(239,68,68,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 8v5M12 16v1"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)',
                marginBottom: 2 }}>
                Confirmar no apto
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.4 }}>
                La verificacion presencial confirmo el resultado. Acceso denegado.
              </div>
            </div>
          </button>

          {/* Falso positivo */}
          <button
            onClick={() => handleVerify('false_positive')}
            disabled={loading}
            style={{
              background: 'rgba(0,201,167,0.06)',
              border: '1.5px solid rgba(0,201,167,0.2)',
              borderRadius: 16, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: loading ? 'wait' : 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(0,201,167,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)',
                marginBottom: 2 }}>
                Falso positivo
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.4 }}>
                La verificacion presencial no detecto problemas. Acceso permitido.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}