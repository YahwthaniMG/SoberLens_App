// frontend/src/pages/UserProfile.jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getSessions } from '../services/api'

const WORK_MESSAGES = [
  "La consistencia en el trabajo construye confianza con el tiempo.",
  "Cada verificacion aprobada es un dia de profesionalismo.",
  "Tu historial habla por ti. Siguelo construyendo.",
  "La responsabilidad es la base de un buen equipo.",
  "Un dia a la vez, un turno a la vez.",
  "El compromiso con la seguridad protege a todos.",
  "Los habitos correctos generan resultados consistentes.",
  "Tu bienestar es parte de la seguridad del equipo.",
]

function getDaysBetween(dateStr, today) {
  const d = new Date(dateStr + 'T12:00:00')
  const t = new Date(today + 'T12:00:00')
  return Math.floor((t - d) / (1000 * 60 * 60 * 24))
}

export default function UserProfile() {
  const navigate = useNavigate()
  const { workerName, area, shift, workerId, logout } = useUserStore()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  const todayStr = new Date().toISOString().slice(0, 10)

  const dailyMessage = useMemo(() => {
    const idx = new Date().getDate() % WORK_MESSAGES.length
    return WORK_MESSAGES[idx]
  }, [])

  useEffect(() => {
    getSessions(200, 0)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

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

    const days        = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
    const totalDays   = days.length
    const aptDays     = days.filter(([, r]) => r === 'sober').length
    const nonAptDays  = days.filter(([, r]) => r === 'drunk').length
    const cautionDays = days.filter(([, r]) => r === 'caution').length

    let currentStreak = 0
    const sortedDesc = [...days].reverse()
    for (const [, result] of sortedDesc) {
      if (result === 'sober') currentStreak++
      else break
    }

    let maxStreak = 0, tempStreak = 0
    for (const [, result] of days) {
      if (result === 'sober') { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak) }
      else tempStreak = 0
    }

    const firstDate      = days[0]?.[0] || null
    const daysSinceStart = firstDate ? getDaysBetween(firstDate, todayStr) + 1 : 0

    return {
      totalDays, aptDays, nonAptDays, cautionDays,
      currentStreak, maxStreak, daysSinceStart,
      totalSessions: sessions.length,
    }
  }, [sessions])

  const initial = workerName ? workerName[0].toUpperCase() : '?'

  return (
    <div className="screen" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Mi perfil</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Avatar + datos */}
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
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)',
              letterSpacing: -0.5 }}>
              {workerName || 'Empleado'}
            </div>
            {(area || shift) && (
              <div style={{ fontSize: 12, color: 'var(--g1)', marginTop: 2 }}>
                {[area, shift].filter(Boolean).join(' · ')}
              </div>
            )}
            {workerId && (
              <div style={{ fontSize: 10, color: 'var(--teal)', marginTop: 4,
                fontFamily: 'var(--mono)' }}>
                ID: {workerId}
              </div>
            )}
          </div>
        </div>

        {/* Mensaje del dia */}
        <div style={{
          background: 'rgba(0,201,167,0.06)', borderRadius: 16, padding: '14px 16px',
          border: '1px solid rgba(0,201,167,0.15)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 600,
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Mensaje del dia
          </div>
          <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{dailyMessage}"
          </div>
        </div>

        {/* Estadisticas */}
        {!loading && stats && (
          <>
            {/* Racha de acceso sin incidencias */}
            <div style={{
              background: stats.currentStreak > 0
                ? 'rgba(0,201,167,0.08)' : 'var(--dark2)',
              borderRadius: 20, padding: '20px',
              border: stats.currentStreak > 0
                ? '1px solid rgba(0,201,167,0.25)' : '1px solid var(--dark3)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 48, fontWeight: 900, letterSpacing: -2,
                color: stats.currentStreak > 0 ? 'var(--teal)' : 'var(--g1)',
              }}>
                {stats.currentStreak}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
                {stats.currentStreak === 1
                  ? 'dia consecutivo sin incidencias'
                  : 'dias consecutivos sin incidencias'}
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
                { label: 'Dias en la app',       value: stats.daysSinceStart,  color: 'var(--white)' },
                { label: 'Verificaciones',        value: stats.totalSessions,   color: 'var(--white)' },
                { label: 'Dias con acceso',       value: stats.aptDays,         color: '#00C9A7' },
                { label: 'Dias sin acceso',       value: stats.nonAptDays,      color: '#EF4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: 'var(--dark2)', borderRadius: 16, padding: '14px 16px',
                  border: '1px solid var(--dark3)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: -1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--g1)', marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de progreso */}
            {stats.totalDays > 0 && (
              <div style={{ background: 'var(--dark2)', borderRadius: 16,
                padding: '14px 16px', border: '1px solid var(--dark3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  marginBottom: 8, fontSize: 11, color: 'var(--g1)' }}>
                  <span>Dias con acceso vs sin acceso</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>
                    {Math.round((stats.aptDays / stats.totalDays) * 100)}% acceso
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--dark3)', borderRadius: 5,
                  overflow: 'hidden', display: 'flex' }}>
                  <div style={{
                    width: `${(stats.aptDays / stats.totalDays) * 100}%`,
                    background: '#00C9A7', transition: 'width 0.6s ease',
                  }} />
                  {stats.cautionDays > 0 && (
                    <div style={{
                      width: `${(stats.cautionDays / stats.totalDays) * 100}%`,
                      background: '#F59E0B',
                    }} />
                  )}
                  <div style={{
                    width: `${(stats.nonAptDays / stats.totalDays) * 100}%`,
                    background: '#EF4444',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8,
                  fontSize: 9, color: 'var(--g1)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#00C9A7' }} />
                    Apto ({stats.aptDays})
                  </span>
                  {stats.cautionDays > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} />
                      Precaucion ({stats.cautionDays})
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
                    No apto ({stats.nonAptDays})
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 20,
            color: 'var(--g1)', fontSize: 13 }}>
            Cargando estadisticas...
          </div>
        )}

        {/* Configuracion */}
        <div style={{ background: 'var(--dark2)', borderRadius: 16,
          border: '1px solid var(--dark3)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dark3)' }}>
            <div style={{ fontSize: 10, color: 'var(--g1)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 1 }}>
              Configuracion
            </div>
          </div>

          <button
            onClick={() => navigate('/privacy')}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--dark3)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>
              Aviso de privacidad
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <path d="M5 3l4 4-4 4"/>
            </svg>
          </button>

          <button
            onClick={() => { logout(); navigate('/') }}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
              Cerrar sesion
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <path d="M5 3l4 4-4 4"/>
            </svg>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--dark3)', paddingTop: 4 }}>
          SoberLens v1.0.0 — Universidad Panamericana 2026
        </div>
      </div>
    </div>
  )
}