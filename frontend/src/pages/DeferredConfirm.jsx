import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions, confirmSession } from '../services/api'

export default function DeferredConfirm() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
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
    setError('')
    try {
      await confirmSession(session.id, correct)
      setDone(true)
    } catch (err) {
      // El backend retorna 425 con detail.message si aun no han pasado 24h
      // Aunque el frontend ya bloquea el boton, cubrimos el caso de race condition
      setError(err.message || 'Error al confirmar. Intenta mas tarde.')
    } finally {
      setConfirming(false)
    }
  }

  function resultLabel(result) {
    if (result === 'drunk') return 'Ebrio'
    if (result === 'sober') return 'Sobrio'
    if (result === 'caution') return 'Precaucion'
    return 'Inconcluso'
  }

  function resultColor(result) {
    if (result === 'drunk') return 'var(--red)'
    if (result === 'sober') return 'var(--teal)'
    if (result === 'caution') return '#F59E0B'
    return 'var(--g1)'
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  function formatAvailableAt(iso) {
    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
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
              ? 'Tu respuesta nos ayuda a mejorar el modelo de deteccion.'
              : 'No hay verificaciones pendientes de confirmar.'}
          </div>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  const canConfirm = session.is_confirmable

  return (
    <div className="screen fade-up" style={{ background: 'var(--dark)' }}>
      {/* Header */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Confirmacion diferida</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Resultado de la sesion */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 16, padding: '20px',
          border: `1px solid ${resultColor(session.result)}22`,
        }}>
          <div style={{ fontSize: 10, color: 'var(--g1)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Verificacion del {formatDate(session.created_at)}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: resultColor(session.result), marginBottom: 4 }}>
            {resultLabel(session.result)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--g1)' }}>
            {Math.round(session.drunk_ratio * 100)}% de probabilidad — {session.analyzed_frames} frames analizados
          </div>
        </div>

        {/* Estado de disponibilidad */}
        {!canConfirm ? (
          <div style={{
            background: 'rgba(245,158,11,0.08)', borderRadius: 16, padding: '20px',
            border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
              Disponible en {session.hours_until_confirmable}h
            </div>
            <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.6 }}>
              La confirmacion estara disponible el {formatAvailableAt(session.confirmable_at)}.
              Queremos que hayas descansado antes de responder para obtener una respuesta honesta.
            </div>
            {/* Barra de progreso del tiempo transcurrido */}
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 4, background: 'var(--dark3)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: '#F59E0B',
                  width: `${Math.min(((24 - session.hours_until_confirmable) / 24) * 100, 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--g1)' }}>
                <span>Verificacion</span>
                <span>24h despues</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.6 }}>
            Ya paso suficiente tiempo. Ahora que estas mas despejado/a — el resultado de esa noche, <strong style={{ color: resultColor(session.result) }}>{resultLabel(session.result)}</strong>, fue correcto?
          </div>
        )}

        {/* Error si el intento de confirmar fallo */}
        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(248,81,73,.12)',
            border: '1px solid rgba(248,81,73,.3)', borderRadius: 10,
            fontSize: 12, color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        {/* Botones de confirmacion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          <button
            className="btn-primary"
            onClick={() => handleConfirm(true)}
            disabled={!canConfirm || confirming}
            style={{ opacity: canConfirm ? 1 : 0.4 }}
          >
            {confirming ? 'Guardando...' : 'Si, fue correcto'}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={!canConfirm || confirming}
            style={{
              background: 'none', border: '1px solid rgba(248,81,73,.4)',
              borderRadius: 14, padding: '14px', color: 'var(--red)',
              fontSize: 15, fontWeight: 600, cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.4,
            }}
          >
            No, el resultado estuvo mal
          </button>
          <div style={{ fontSize: 10, color: 'var(--g1)', textAlign: 'center', marginTop: 4 }}>
            Tu respuesta se usa para mejorar la precision del modelo
          </div>
        </div>
      </div>
    </div>
  )
}