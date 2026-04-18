import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions, confirmSession } from '../services/api'

export default function DeferredConfirm() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Busca la sesion mas reciente sin confirmar
    getSessions(10, 0)
      .then(data => {
        const pending = (data.sessions || []).find(s => s.user_confirmed === null)
        setSession(pending || null)
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm(correct) {
    if (!session) return
    setConfirming(true)
    try {
      await confirmSession(session.id, correct)
      setDone(true)
    } catch {
      // si falla igual mostramos done para no bloquear al usuario
      setDone(true)
    } finally {
      setConfirming(false)
    }
  }

  function resultLabel(result) {
    if (result === 'drunk') return 'Ebrio'
    if (result === 'sober') return 'Sobrio'
    return 'Inconcluso'
  }

  function resultColor(result) {
    if (result === 'drunk') return 'var(--red)'
    if (result === 'sober') return 'var(--teal)'
    return 'var(--amber)'
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="screen" style={{ background: 'var(--dark)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--g1)', fontSize: 13 }}>Cargando...</div>
      </div>
    )
  }

  if (!session || done) {
    return (
      <div className="screen fade-up" style={{ background: 'var(--dark)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--teal)' }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
            {done ? 'Gracias por tu respuesta' : 'Sin sesiones pendientes'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6, marginBottom: 32 }}>
            {done
              ? 'Tu respuesta nos ayuda a mejorar el modelo de detección.'
              : 'No hay verificaciones pendientes de confirmar.'}
          </div>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  const color = resultColor(session.result)

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          ← Omitir
        </button>
        <span style={{ fontSize: 11 }}>Verificación</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'var(--dark3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            🤔
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--g1)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
              CONFIRMACIÓN DIFERIDA
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--white)' }}>
              ¿Fue correcto el resultado?
            </div>
          </div>
        </div>

        {/* Memoria de la sesion */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', padding: 16,
        }}>
          <div style={{
            fontSize: 10, color: 'var(--g1)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--mono)',
          }}>
            Sesión analizada
          </div>
          {[
            { key: 'Fecha', val: formatDate(session.created_at) },
            { key: 'Resultado', val: resultLabel(session.result), color },
            { key: 'Ratio de intoxicación', val: `${Math.round(session.drunk_ratio * 100)}%`, color },
            { key: 'Frames analizados', val: `${session.analyzed_frames} / ${session.total_frames}` },
          ].map((row, i, arr) => (
            <div key={i}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0',
              }}>
                <span style={{ fontSize: 11, color: 'var(--g1)' }}>{row.key}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: row.color || 'var(--g2)' }}>
                  {row.val}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ height: 1, background: 'var(--dark3)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Pregunta */}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', lineHeight: 1.4, marginBottom: 8 }}>
            En ese momento, ¿estabas realmente {resultLabel(session.result).toLowerCase()}?
          </div>
          <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.6 }}>
            Tu respuesta es anónima y nos ayuda a mejorar la precisión del modelo.
          </div>
        </div>

        {/* Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { correct: true, emoji: '✅', title: 'Sí, fue correcto', desc: 'El resultado reflejó mi estado real' },
            { correct: false, emoji: '❌', title: 'No, fue incorrecto', desc: 'El resultado no reflejó mi estado real' },
          ].map(opt => (
            <button
              key={String(opt.correct)}
              onClick={() => handleConfirm(opt.correct)}
              disabled={confirming}
              style={{
                padding: '14px 16px', borderRadius: 14,
                border: `1.5px solid ${opt.correct ? 'var(--teal)' : 'var(--dark3)'}`,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                background: 'var(--dark2)', transition: 'all 0.2s',
                opacity: confirming ? 0.6 : 1,
                textAlign: 'left', width: '100%',
              }}
            >
              <span style={{ fontSize: 18 }}>{opt.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{opt.title}</div>
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Skip */}
      <div style={{ padding: '0 28px 40px', textAlign: 'center' }}>
        <button
          className="btn-ghost"
          onClick={() => navigate('/dashboard')}
          style={{ fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Omitir por ahora
        </button>
      </div>
    </div>
  )
}