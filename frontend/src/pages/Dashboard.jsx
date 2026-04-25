import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getSessions } from '../services/api'
import { updateContact } from '../services/api'

function useRealTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function resultColor(result) {
  if (result === 'drunk') return 'var(--red)'
  if (result === 'caution') return 'var(--amber)'
  if (result === 'sober') return 'var(--teal)'
  return 'var(--g1)'
}

function resultLabel(result) {
  if (result === 'drunk') return 'Ebrio'
  if (result === 'caution') return 'Precaución'
  if (result === 'sober') return 'Sobrio'
  return 'Sin datos'
}

function resultDesc(result) {
  if (result === 'drunk') return 'Se detectaron signos claros de intoxicación.'
  if (result === 'caution') return 'Posibles signos de fatiga o alcohol leve.'
  if (result === 'sober') return 'No se detectaron signos de intoxicación.'
  return 'Realiza tu primera verificación'
}

function statusGradient(result) {
  if (result === 'drunk') return 'linear-gradient(135deg, #C0392B, #922B21)'
  if (result === 'caution') return 'linear-gradient(135deg, #D4A017, #9A7D0A)'
  return 'linear-gradient(135deg, #00C9A7, #00856F)'
}

function statusDot(result) {
  if (result === 'drunk') return '#FF8A80'
  if (result === 'caution') return '#FFE082'
  return '#7DFFDE'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const now = useRealTime()
  const { emergencyContact, setEmergencyContact, name } = useUserStore()

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
  const cautionSessions = sessions.filter(s => s.result === 'caution').length
  const lastSession = sessions[0] || null

  async function saveContact() {
  if (!contactInput.trim()) return
  try {
    await updateContact(contactInput.trim(), contactNameInput.trim() || undefined)
    setEmergencyContact(contactInput.trim())
    localStorage.setItem('soberlens_emergency_contact', contactInput.trim())
    if (contactNameInput.trim()) {
      setContactName(contactNameInput.trim())
      localStorage.setItem('soberlens_contact_name', contactNameInput.trim())
    }
    setEditingContact(false)
    setContactInput('')
    setContactNameInput('')
  } catch (err) {
    console.error('Error guardando contacto:', err)
  }
}

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const currentResult = lastSession?.result || null
  const [contactNameInput, setContactNameInput] = useState('')
  const [contactName, setContactName] = useState(
    localStorage.getItem('soberlens_contact_name') || ''
  )

  return (
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        background: 'var(--white)', padding: '48px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--g1)' }}>
            {now.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
            {name ? `Hola, ${name.split(' ')[0]}` : 'SoberLens'}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600,
          color: 'var(--dark2)', background: 'var(--g3)',
          padding: '4px 10px', borderRadius: 8,
        }}>
          {timeStr}
        </div>
      </div>

      {/* Status card */}
      <div style={{
        margin: '12px 16px', borderRadius: 20, padding: 18,
        background: statusGradient(currentResult),
        boxShadow: currentResult === 'drunk'
          ? '0 8px 24px rgba(248,81,73,.3)'
          : currentResult === 'caution'
          ? '0 8px 24px rgba(210,153,34,.3)'
          : '0 8px 24px rgba(0,201,167,.3)',
        color: 'white',
        transition: 'background 0.5s',
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
          Estado actual
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: statusDot(currentResult),
            boxShadow: `0 0 8px ${statusDot(currentResult)}`,
          }} />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
            {currentResult ? resultLabel(currentResult) : 'Sin datos'}
          </div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.75 }}>
          {lastSession
            ? `${resultDesc(currentResult)} · ${formatDate(lastSession.created_at)}`
            : 'Realiza tu primera verificación'}
        </div>
      </div>

      {/* Stats */}
      <div style={{ margin: '0 16px 12px', display: 'flex', gap: 8 }}>
        {[
          { val: totalSessions, label: 'Verificaciones' },
          { val: drunkSessions, label: 'Alertas', color: drunkSessions > 0 ? 'var(--red)' : 'var(--dark)' },
          { val: cautionSessions, label: 'Precaución', color: cautionSessions > 0 ? 'var(--amber)' : 'var(--dark)' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, background: 'var(--white)', borderRadius: 14,
            padding: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color || 'var(--dark)' }}>{stat.val}</div>
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
  <>
    <input
      value={contactNameInput}
      onChange={e => setContactNameInput(e.target.value)}
      placeholder="Nombre del contacto"
      style={{
        width: '100%', marginBottom: 8,
        background: 'var(--dark3)', border: '1px solid var(--teal)',
        borderRadius: 10, padding: '8px 12px', color: 'var(--white)',
        fontSize: 13, fontFamily: 'var(--font)', outline: 'none',
        boxSizing: 'border-box',
      }}
    />
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
  </>
) : (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: '#FFE5EA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: 'var(--red)', flexShrink: 0,
    }}>
      {contactName ? contactName[0].toUpperCase() : emergencyContact ? emergencyContact[0].toUpperCase() : '?'}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: 'var(--g1)' }}>Contacto de emergencia</div>
      {contactName && (
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
          {contactName}
        </div>
      )}
      <div style={{ fontSize: 11, color: contactName ? 'var(--g1)' : 'var(--dark)', fontWeight: contactName ? 400 : 600 }}>
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

      {/* Botones */}
      <div style={{ padding: '4px 16px 16px' }}>
        <button className="btn-primary" onClick={() => navigate('/capture')}>
          Iniciar verificación
        </button>
      </div>
      <div style={{ padding: '0 16px 40px' }}>
        <button className="btn-outline" onClick={() => navigate('/confirm')} style={{ fontSize: 13 }}>
          Confirmar resultado anterior
        </button>
      </div>
    </div>
  )
}