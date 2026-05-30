// frontend/src/pages/AdminEmployeeDetail.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmployeeHistory } from '../services/api'

export default function AdminEmployeeDetail() {
  const navigate          = useNavigate()
  const { id }            = useParams()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getEmployeeHistory(id)
      .then(setData)
      .catch(() => setError('No se pudo cargar el historial.'))
      .finally(() => setLoading(false))
  }, [id])

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
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>
      <div style={{
        background: 'var(--white)', padding: '48px 24px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate('/admin/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13, padding: 0 }}
        >
          Atras
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
          {data ? data.name : 'Empleado'}
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
            borderRadius: 14, padding: '14px 16px', fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Info del empleado */}
            <div style={{
              background: 'var(--white)', borderRadius: 18, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>
                {data.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--g1)' }}>
                {[data.area, data.shift].filter(Boolean).join(' · ')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', marginTop: 4 }}>
                {data.total} verificaciones registradas
              </div>
            </div>

            {/* Historial */}
            {data.sessions.length === 0 ? (
              <div style={{
                background: 'var(--white)', borderRadius: 18,
                padding: '28px 20px', textAlign: 'center',
                fontSize: 13, color: 'var(--g1)',
              }}>
                Este empleado aun no tiene verificaciones registradas.
              </div>
            ) : (
              <div style={{
                background: 'var(--white)', borderRadius: 18, padding: 20,
                display: 'flex', flexDirection: 'column', gap: 0,
              }}>
                <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  Historial
                </div>

                {data.sessions.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: 12,
                      paddingBottom: 12, marginBottom: 12,
                      borderBottom: i < data.sessions.length - 1
                        ? '1px solid var(--g3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: resultColor(s.result),
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>
                          {resultLabel(s.result)}
                          {s.second_verification_result === 'false_positive' && (
                            <span style={{ fontSize: 10, color: 'var(--teal)',
                              marginLeft: 6, fontWeight: 500 }}>
                              Falso positivo
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                          {formatDate(s.created_at)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700,
                        color: resultColor(s.result),
                      }}>
                        {Math.round(s.drunk_ratio * 100)}%
                      </div>

                      {/* Boton de segunda verificacion */}
                      {(s.result === 'drunk' || s.result === 'caution') &&
                        s.second_verification_result === null && (
                        <button
                          onClick={() => navigate(`/admin/sessions/${s.id}/verify`)}
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 8, padding: '5px 10px',
                            fontSize: 11, fontWeight: 600, color: 'var(--red)',
                            cursor: 'pointer',
                          }}
                        >
                          Verificar
                        </button>
                      )}

                      {s.second_verification_result === 'confirmed' && (
                        <div style={{
                          fontSize: 10, color: 'var(--red)',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 8, padding: '4px 8px',
                        }}>
                          Confirmado
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}