import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getSessions } from '../services/api'

const MOTIVATIONAL_MESSAGES = [
  "Cada dia sobrio es una victoria real. Sigue adelante.",
  "El cambio no pasa de golpe — pasa un dia a la vez.",
  "Reconocer el problema es el paso mas valiente.",
  "Tus datos son tu evidencia. Los numeros no mienten.",
  "La consistencia es mas poderosa que la intensidad.",
  "No se trata de ser perfecto, se trata de seguir intentando.",
  "Cada verificación que haces es un acto de autocuidado.",
  "El historial que construyes hoy es el orgullo de mañana.",
]

function getDaysBetween(dateStr, today) {
  const d = new Date(dateStr + 'T12:00:00')
  const t = new Date(today + 'T12:00:00')
  return Math.floor((t - d) / (1000 * 60 * 60 * 24))
}

export default function UserProfile() {
  const navigate = useNavigate()
  const { name, ageRange, consentRetraining, setConsent, consentProcessing, deviceId } = useUserStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [retrainingToggle, setRetrainingToggle] = useState(consentRetraining)

  const todayStr = new Date().toISOString().slice(0, 10)

  // Mensaje motivacional del dia (determinista por fecha, no aleatorio)
  const dailyMessage = useMemo(() => {
    const idx = new Date().getDate() % MOTIVATIONAL_MESSAGES.length
    return MOTIVATIONAL_MESSAGES[idx]
  }, [])

  useEffect(() => {
    getSessions(200, 0)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  // Estadisticas globales
  const stats = useMemo(() => {
    if (!sessions.length) return null

    const byDay = {}
    for (const s of sessions) {
      const d = s.created_at.slice(0, 10)
      const PRIORITY = { drunk: 3, caution: 2, sober: 1 }
      if (!byDay[d] || (PRIORITY[s.result] || 0) > (PRIORITY[byDay[d]] || 0)) {
        byDay[d] = s.result
      }
    }

    const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
    const totalDays = days.length
    const soberDays = days.filter(([, r]) => r === 'sober').length
    const drunkDays = days.filter(([, r]) => r === 'drunk').length
    const cautionDays = days.filter(([, r]) => r === 'caution').length

    // Racha actual de dias sobrios (desde el dia mas reciente hacia atras)
    let currentStreak = 0
    const sortedDesc = [...days].reverse()
    for (const [, result] of sortedDesc) {
      if (result === 'sober') currentStreak++
      else break
    }

    // Racha maxima de dias sobrios
    let maxStreak = 0
    let tempStreak = 0
    for (const [, result] of days) {
      if (result === 'sober') {
        tempStreak++
        maxStreak = Math.max(maxStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Primera verificacion
    const firstDate = days[0]?.[0] || null
    const daysSinceStart = firstDate ? getDaysBetween(firstDate, todayStr) + 1 : 0

    return { totalDays, soberDays, drunkDays, cautionDays, currentStreak, maxStreak, daysSinceStart, totalSessions: sessions.length }
  }, [sessions])

  function handleToggleRetraining() {
    const newVal = !retrainingToggle
    setRetrainingToggle(newVal)
    setConsent(consentProcessing, newVal)
  }

  const initial = name ? name[0].toUpperCase() : '?'

  return (
    <div className="screen" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      {/* Header */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Mi perfil</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Avatar + nombre */}
        <div style={{
          background: 'var(--dark2)', borderRadius: 20, padding: '24px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          border: '1px solid var(--dark3)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--teal), var(--teal-d))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'var(--dark)', flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>
              {name || 'Usuario'}
            </div>
            {ageRange && (
              <div style={{ fontSize: 12, color: 'var(--g1)', marginTop: 2 }}>{ageRange} años</div>
            )}
            <div style={{ fontSize: 10, color: 'var(--teal)', marginTop: 4, fontFamily: 'var(--mono)' }}>
              {deviceId.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div style={{
          background: 'rgba(0,201,167,0.06)', borderRadius: 16, padding: '14px 16px',
          border: '1px solid rgba(0,201,167,0.15)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Mensaje del dia
          </div>
          <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{dailyMessage}"
          </div>
        </div>

        {/* Estadisticas historicas */}
        {!loading && stats && (
          <>
            {/* Racha actual */}
            <div style={{
              background: stats.currentStreak > 0
                ? 'rgba(0,201,167,0.08)'
                : 'var(--dark2)',
              borderRadius: 20, padding: '20px',
              border: stats.currentStreak > 0
                ? '1px solid rgba(0,201,167,0.25)'
                : '1px solid var(--dark3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: stats.currentStreak > 0 ? 'var(--teal)' : 'var(--g1)', letterSpacing: -2 }}>
                {stats.currentStreak}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
                {stats.currentStreak === 1 ? 'dia sobrio consecutivo' : 'dias sobrios consecutivos'}
              </div>
              {stats.maxStreak > stats.currentStreak && (
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                  Mejor racha: {stats.maxStreak} dias
                </div>
              )}
              {stats.currentStreak > 0 && stats.currentStreak === stats.maxStreak && (
                <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4 }}>
                  Tu mejor racha hasta ahora
                </div>
              )}
            </div>

            {/* Grid de stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Dias en la app', value: stats.daysSinceStart, color: 'var(--white)' },
                { label: 'Verificaciones', value: stats.totalSessions, color: 'var(--white)' },
                { label: 'Dias sobrio', value: stats.soberDays, color: '#00C9A7' },
                { label: 'Dias ebrio', value: stats.drunkDays, color: '#EF4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: 'var(--dark2)', borderRadius: 16, padding: '14px 16px',
                  border: '1px solid var(--dark3)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--g1)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Barra de progreso sobrio/ebrio */}
            {stats.totalDays > 0 && (
              <div style={{ background: 'var(--dark2)', borderRadius: 16, padding: '14px 16px', border: '1px solid var(--dark3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: 'var(--g1)' }}>
                  <span>Dias sobrio vs ebrio</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>
                    {Math.round((stats.soberDays / stats.totalDays) * 100)}% sobrio
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--dark3)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div style={{
                    width: `${(stats.soberDays / stats.totalDays) * 100}%`,
                    background: '#00C9A7', transition: 'width 0.6s ease',
                  }} />
                  {stats.cautionDays > 0 && (
                    <div style={{
                      width: `${(stats.cautionDays / stats.totalDays) * 100}%`,
                      background: '#F59E0B',
                    }} />
                  )}
                  <div style={{
                    width: `${(stats.drunkDays / stats.totalDays) * 100}%`,
                    background: '#EF4444',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 9, color: 'var(--g1)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#00C9A7' }} /> Sobrio ({stats.soberDays})
                  </span>
                  {stats.cautionDays > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} /> Precaucion ({stats.cautionDays})
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} /> Ebrio ({stats.drunkDays})
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--g1)', fontSize: 13 }}>
            Cargando estadisticas...
          </div>
        )}

        {/* Configuracion de datos */}
        <div style={{ background: 'var(--dark2)', borderRadius: 16, border: '1px solid var(--dark3)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dark3)' }}>
            <div style={{ fontSize: 10, color: 'var(--g1)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Configuracion
            </div>
          </div>

          {/* Toggle retraining */}
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid var(--dark3)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
                Contribuir datos de entrenamiento
              </div>
              <div style={{ fontSize: 11, color: 'var(--g1)', marginTop: 2, lineHeight: 1.4 }}>
                Tus sesiones anonimizadas ayudan a mejorar el modelo
              </div>
            </div>
            <button
              onClick={handleToggleRetraining}
              style={{
                width: 44, height: 26, borderRadius: 13, border: 'none',
                background: retrainingToggle ? 'var(--teal)' : 'var(--dark3)',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3,
                left: retrainingToggle ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Aviso de privacidad */}
          <button
            onClick={() => navigate('/privacy')}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
              Aviso de privacidad
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <path d="M5 3l4 4-4 4"/>
            </svg>
          </button>
        </div>

        {/* Version */}
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--dark3)', paddingTop: 4 }}>
          SoberLens v0.1.0 — Universidad Panamericana 2025
        </div>
      </div>
    </div>
  )
}