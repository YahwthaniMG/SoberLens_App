import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getSessions } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { emergencyContact, setEmergencyContact } = useUserStore()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingContact, setEditingContact] = useState(false)
  const [contactInput, setContactInput] = useState(emergencyContact)

  useEffect(() => {
    getSessions(5, 0)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const totalSessions = sessions.length
  const drunkSessions = sessions.filter(s => s.result === 'drunk').length
  const lastSession = sessions[0] || null

  function saveContact() {
    setEmergencyContact(contactInput.trim())
    setEditingContact(false)
  }

  function resultColor(result) {
    if (result === 'drunk') return 'var(--red)'
    if (result === 'sober') return 'var(--teal)'
    return 'var(--g1)'
  }

  function resultLabel(result) {
    if (result === 'drunk') return 'Ebrio'
    if (result === 'sober') return 'Sobrio'
    return 'Inconcluso'
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        background: 'var(--white)', padding: '48px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--g1)' }}>Bienvenido</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>SoberLens</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--teal-l)', border: '2px solid var(--teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'var(--teal-d)',
        }}>SL</div>
      </div>

      {/* Status card */}
      <div style={{
        margin: '12px 16px', borderRadius: 20, padding: 18,
        background: 'linear-gradient(135deg, #00C9A7, #00856F)',
        boxShadow: '0 8px 24px rgba(0,201,167,.3)', color: 'white',
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
          Estado actual
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7DFFDE', boxShadow: '0 0 8px #7DFFDE' }} />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
            {lastSession ? resultLabel(lastSession.result) : 'Sin datos'}
          </div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.75 }}>
          {lastSession
            ? `Última verificación: ${formatDate(lastSession.created_at)}`
            : 'Realiza tu primera verificación'}
        </div>
      </div>

      {/* Stats */}
      <div style={{ margin: '0 16px 12px', display: 'flex', gap: 8 }}>
        {[
          { val: totalSessions, label: 'Verificaciones' },
          { val: drunkSessions, label: 'Alertas' },
          {
            val: totalSessions > 0
              ? `${Math.round((1 - drunkSessions / totalSessions) * 100)}%`
              : '--',
            label: 'Sobrio',
          },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, background: 'var(--white)', borderRadius: 14,
            padding: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>{stat.val}</div>
            <div style={{ fontSize: 9, color: 'var(--g1)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Contacto de emergencia */}
      <div style={{ margin: '0 16px 12px', background: 'var(--white)', borderRadius: 16, padding: '12px 16px' }}>
        <div style={{ fontSize: 10, color: 'var(--g1)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Contacto de emergencia
        </div>
        {editingContact ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={contactInput}
              onChange={e => setContactInput(e.target.value)}
              placeholder="+521234567890"
              style={{
                flex: 1, background: 'var(--dark3)', border: '1px solid var(--teal)',
                borderRadius: 10, padding: '8px 12px', color: 'var(--white)',
                fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
              }}
            />
            <button onClick={saveContact} style={{
              background: 'var(--teal)', color: 'var(--dark)', border: 'none',
              borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              Guardar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#FFE5EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--red)', flexShrink: 0,
            }}>
              {emergencyContact ? emergencyContact[0].toUpperCase() : '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'var(--g1)' }}>Contacto</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)' }}>
                {emergencyContact || 'No configurado'}
              </div>
            </div>
            <button onClick={() => setEditingContact(true)} style={{
              fontSize: 9, background: 'var(--teal-l)', color: 'var(--teal-d)',
              borderRadius: 6, padding: '4px 10px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
            }}>
              {emergencyContact ? 'Editar' : 'Agregar'}
            </button>
          </div>
        )}
      </div>

      {/* Historial reciente */}
      {sessions.length > 0 && (
        <div style={{ margin: '0 16px 12px', background: 'var(--white)', borderRadius: 16, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--g1)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Historial reciente
          </div>
          {sessions.slice(0, 3).map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < 2 ? '1px solid var(--g3)' : 'none',
            }}>
              <div style={{ fontSize: 11, color: 'var(--g1)' }}>{formatDate(s.created_at)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>{Math.round(s.drunk_ratio * 100)}%</div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: resultColor(s.result),
                  background: `${resultColor(s.result)}18`,
                  borderRadius: 6, padding: '2px 8px',
                }}>
                  {resultLabel(s.result)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Boton principal */}
      <div style={{ padding: '4px 16px 16px' }}>
        <button className="btn-primary" onClick={() => navigate('/capture')}>
          Iniciar verificación
        </button>
      </div>

      {/* Confirmacion diferida */}
      <div style={{ padding: '0 16px 40px' }}>
        <button
          className="btn-outline"
          onClick={() => navigate('/confirm')}
          style={{ fontSize: 13 }}
        >
          Confirmar resultado anterior
        </button>
      </div>
    </div>
  )
}