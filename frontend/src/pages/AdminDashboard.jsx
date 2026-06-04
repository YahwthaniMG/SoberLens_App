// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getAdminDashboard } from '../services/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { adminCompanyName, adminAccessCode, logout } = useUserStore()

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => setError('No se pudo cargar el panel.'))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  return (
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{
        background: 'var(--white)', padding: '48px 24px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--g1)' }}>{dateStr}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
            {adminCompanyName || 'Panel de administracion'}
          </div>
          {adminAccessCode && (
            <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2,
              fontFamily: 'var(--mono)', fontWeight: 600 }}>
              Codigo: {adminAccessCode}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/admin/settings')}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--g3)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--g3)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--g1)', fontSize: 13 }}>
            Cargando...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats del turno */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Activos',     value: data.total_active,       color: 'var(--dark)' },
                { label: 'Verificados', value: data.verified_today,     color: 'var(--teal)' },
                { label: 'Pendientes',  value: data.pending_verification, color: 'var(--amber)' },
                { label: 'Alertas',     value: data.alerts.length,      color: 'var(--red)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, background: 'var(--white)', borderRadius: 16,
                  padding: '14px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--g1)', marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Alertas pendientes */}
            {data.alerts.length > 0 && (
              <div style={{
                background: 'var(--white)', borderRadius: 18, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{
                  fontSize: 11, color: 'var(--red)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  Requieren verificacion presencial
                </div>

                {data.alerts.map(alert => (
                  <div
                    key={alert.session_id}
                    onClick={() => navigate(`/admin/employees/${alert.employee_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(239,68,68,0.04)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: 14, cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: alert.result === 'drunk'
                          ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke={alert.result === 'drunk' ? 'var(--red)' : 'var(--amber)'}
                          strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 8v5M12 16v1"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                          {alert.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                          {[alert.area, alert.shift].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: alert.result === 'drunk' ? 'var(--red)' : 'var(--amber)',
                      }}>
                        {Math.round(alert.drunk_ratio * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--g1)' }}>
                        {alert.result === 'drunk' ? 'No apto' : 'Precaucion'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sin alertas */}
            {data.alerts.length === 0 && data.total_active > 0 && (
              <div style={{
                background: 'var(--white)', borderRadius: 18,
                padding: '28px 20px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(0,201,167,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
                  Sin alertas hoy
                </div>
                <div style={{ fontSize: 12, color: 'var(--g1)' }}>
                  Todas las verificaciones realizadas resultaron aptas
                </div>
              </div>
            )}

            {/* Accesos rapidos */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/admin/employees')}
                style={{
                  flex: 1, background: 'var(--white)', border: 'none',
                  borderRadius: 16, padding: '16px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)' }}>
                  Empleados
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/settings')}
                style={{
                  background: 'var(--white)', border: 'none',
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', width: '100%',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>
                  Configuracion
                </div>
                <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 14 14"
                  fill="none" stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 3l4 4-4 4"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}