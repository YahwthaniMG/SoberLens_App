// frontend/src/pages/AdminEmployeeList.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanyEmployees } from '../services/api'

export default function AdminEmployeeList() {
  const navigate = useNavigate()

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filterShift, setFilterShift] = useState('')

  useEffect(() => {
    getCompanyEmployees()
      .then(setData)
      .catch(() => setError('No se pudo cargar la lista de empleados.'))
      .finally(() => setLoading(false))
  }, [])

  const employees = data?.employees || []

  const shifts = [...new Set(employees.map(e => e.shift).filter(Boolean))]

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.worker_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.area || '').toLowerCase().includes(search.toLowerCase())
    const matchShift = !filterShift || e.shift === filterShift
    return matchSearch && matchShift
  })

  return (
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>
      {/* Header */}
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
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
            Empleados
          </div>
          {data && (
            <div style={{ fontSize: 11, color: 'var(--g1)' }}>
              {data.total} registrados
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px 40px', display: 'flex',
        flexDirection: 'column', gap: 12 }}>

        {/* Busqueda */}
        <div style={{
          background: 'var(--white)', borderRadius: 14,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ID o area..."
            style={{
              flex: 1, background: 'none', border: 'none',
              outline: 'none', fontSize: 14, color: 'var(--dark)',
            }}
          />
        </div>

        {/* Filtro por turno */}
        {shifts.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 2 }}>
            <button
              onClick={() => setFilterShift('')}
              style={{
                background: !filterShift ? 'var(--teal)' : 'var(--white)',
                color: !filterShift ? 'var(--dark)' : 'var(--g1)',
                border: 'none', borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Todos
            </button>
            {shifts.map(s => (
              <button
                key={s}
                onClick={() => setFilterShift(s)}
                style={{
                  background: filterShift === s ? 'var(--teal)' : 'var(--white)',
                  color: filterShift === s ? 'var(--dark)' : 'var(--g1)',
                  border: 'none', borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40,
            color: 'var(--g1)', fontSize: 13 }}>
            Cargando...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 14, padding: '14px 16px',
            fontSize: 13, color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{
            background: 'var(--white)', borderRadius: 18,
            padding: '28px 20px', textAlign: 'center',
            fontSize: 13, color: 'var(--g1)',
          }}>
            No se encontraron empleados.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{
            background: 'var(--white)', borderRadius: 18,
            overflow: 'hidden',
          }}>
            {filtered.map((e, i) => (
              <div
                key={e.id}
                onClick={() => navigate(`/admin/employees/${e.id}`)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: '14px 18px',
                  borderBottom: i < filtered.length - 1
                    ? '1px solid var(--g3)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: e.registered
                    ? 'rgba(0,201,167,0.12)' : 'var(--g3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700,
                  color: e.registered ? 'var(--teal)' : 'var(--g1)',
                }}>
                  {e.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--dark)',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--g1)', marginTop: 1 }}>
                    {[e.worker_id, e.area, e.shift].filter(Boolean).join(' · ')}
                  </div>
                </div>

                {/* Estado registro */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600,
                    color: e.registered ? 'var(--teal)' : 'var(--g1)',
                    background: e.registered
                      ? 'rgba(0,201,167,0.1)' : 'var(--g3)',
                    borderRadius: 6, padding: '3px 8px',
                  }}>
                    {e.registered ? 'Activo' : 'Sin registro'}
                  </div>
                </div>

                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 3l4 4-4 4"/>
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}