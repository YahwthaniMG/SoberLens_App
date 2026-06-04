// frontend/src/pages/EmployeeDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getSessions } from '../services/api'

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const { workerName, area, shift, logout } = useUserStore()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [now, setNow]           = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    getSessions(30, 0)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const todayStr     = now.toISOString().slice(0, 10)
  const todaySession = sessions.find(s => s.created_at.slice(0, 10) === todayStr)
  const totalSessions = sessions.length
  const aptSessions   = sessions.filter(s => s.result === 'sober').length
  const aptRate       = totalSessions > 0 ? Math.round((aptSessions / totalSessions) * 100) : null
  const dateStr       = now.toLocaleDateString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  function resultColor(result) {
    if (result === 'sober')   return 'var(--teal)'
    if (result === 'drunk')   return 'var(--red)'
    if (result === 'caution') return 'var(--amber)'
    return 'var(--g1)'
  }

  function resultLabel(result) {
    if (result === 'sober')   return 'Apto'
    if (result === 'drunk')   return 'No apto'
    if (result === 'caution') return 'Precaucion'
    return 'Inconcluso'
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="screen" style={{
      background: 'var(--g3)', overflowY: 'auto', paddingBottom: 100,
    }}>

      {/* Header */}
      <div style={{
        background: 'var(--white)', padding: '48px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--g1)' }}>{dateStr}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
            {workerName ? `Hola, ${workerName.split(' ')[0]}` : 'SoberLens'}
          </div>
          {(area || shift) && (
            <div style={{ fontSize: 11, color: 'var(--g1)', marginTop: 2 }}>
              {[area, shift].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--teal), var(--teal-d))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: 'var(--dark)',
          }}
        >
          {workerName ? workerName[0].toUpperCase() : '?'}
        </button>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Verificacion de hoy */}
        <div style={{
          background: 'var(--white)', borderRadius: 18, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Verificacion de hoy
          </div>

          {todaySession ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${resultColor(todaySession.result)}18`,
                border: `1.5px solid ${resultColor(todaySession.result)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {todaySession.result === 'sober' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 8v5M12 16v1"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
                  {resultLabel(todaySession.result)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--g1)' }}>
                  {formatDate(todaySession.created_at)}
                </div>
                {todaySession.result !== 'sober' && (
                  <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 2 }}>
                    Verificacion presencial pendiente
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'var(--g3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>
                    Pendiente
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--g1)' }}>
                    Aun no has realizado la verificacion de hoy
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/capture')}
                style={{
                  background: 'var(--teal)', color: 'var(--dark)',
                  border: 'none', borderRadius: 14, padding: '14px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
                }}
              >
                Iniciar verificacion
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        {totalSessions > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Verificaciones',      value: totalSessions, color: 'var(--dark)' },
              { label: 'Tasa de acceso',       value: `${aptRate}%`, color: 'var(--teal)' },
              { label: 'Dias sin incidencias', value: aptSessions,   color: 'var(--dark)' },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: 1, background: 'var(--white)', borderRadius: 16,
                padding: '14px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--g1)', marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historial reciente */}
        {sessions.length > 0 && (
          <div style={{
            background: 'var(--white)', borderRadius: 18, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1 }}>
                Historial reciente
              </div>
              <button
                onClick={() => navigate('/schedule')}
                style={{ background: 'none', border: 'none', fontSize: 12,
                  color: 'var(--teal)', cursor: 'pointer', fontWeight: 600 }}
              >
                Ver todo
              </button>
            </div>

            {sessions.slice(0, 5).map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12,
                paddingBottom: 10, borderBottom: '1px solid var(--g3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: resultColor(s.result), flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
                      {resultLabel(s.result)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                      {formatDate(s.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: resultColor(s.result) }}>
                  {Math.round(s.drunk_ratio * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegacion inferior fija */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--white)',
        borderTop: '1px solid var(--g3)',
        padding: '10px 16px 28px',
        display: 'flex', gap: 0,
        zIndex: 100,
      }}>
        {[
          {
            label: 'Calendario',
            path: '/schedule',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            ),
          },
          {
            label: 'Mi perfil',
            path: '/profile',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="7" r="4"/>
                <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8"/>
              </svg>
            ),
          },
          {
            label: 'Salir',
            action: () => { logout(); navigate('/') },
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            ),
            labelColor: 'var(--g1)',
          },
        ].map(item => (
          <button
            key={item.label}
            onClick={item.action || (() => navigate(item.path))}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '8px 4px',
            }}
          >
            {item.icon}
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: item.labelColor || 'var(--dark)',
            }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}