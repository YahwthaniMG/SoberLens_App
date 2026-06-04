// frontend/src/pages/EmployeeIdVerify.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { verifyWorkerId } from '../services/api'

export default function EmployeeIdVerify() {
  const navigate = useNavigate()
  const { companyId, companyName, setEmployeeProfile } = useUserStore()

  const [workerId, setWorkerId] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [preview, setPreview]   = useState(null)

  async function handleSearch() {
    if (!workerId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await verifyWorkerId(workerId.trim(), Number(companyId))
      setPreview(data)
    } catch (err) {
      setError(err.message || 'ID no encontrado en esta empresa.')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    setEmployeeProfile(
      preview.employee_id,
      workerId.trim(),
      preview.name,
      preview.area || '',
      preview.shift || '',
    )
    navigate('/consent')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/join')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Atras
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Identificacion</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 8 }}>
            {companyName}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 8 }}>
            Ingresa tu ID de trabajador
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            Es el numero o clave que te asigno tu empresa. Aparece en tu credencial o contrato.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={workerId}
            onChange={e => { setWorkerId(e.target.value); setError(''); setPreview(null) }}
            placeholder="Ej. EMP001"
            style={{
              background: 'var(--dark2)',
              border: `1px solid ${error ? '#ef4444' : 'var(--dark3)'}`,
              borderRadius: 12, padding: '14px 16px',
              fontSize: 16, color: 'var(--white)',
              outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
          )}
        </div>

        {/* Preview del empleado */}
        {preview && (
          <div style={{
            background: 'var(--dark2)', border: '1px solid var(--teal)',
            borderRadius: 16, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 2 }}>
              Empleado encontrado
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>
              {preview.name}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {preview.area && (
                <div style={{ fontSize: 12, color: 'var(--g1)' }}>{preview.area}</div>
              )}
              {preview.shift && (
                <div style={{ fontSize: 12, color: 'var(--g1)' }}>{preview.shift}</div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!preview ? (
            <button
              onClick={handleSearch}
              disabled={loading || !workerId.trim()}
              style={{
                background: workerId.trim() ? 'var(--teal)' : 'var(--dark3)',
                color: workerId.trim() ? 'var(--dark)' : 'var(--g1)',
                border: 'none', borderRadius: 14, padding: '16px',
                fontSize: 15, fontWeight: 700,
                cursor: workerId.trim() ? 'pointer' : 'default', width: '100%',
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                style={{
                  background: 'var(--teal)', color: 'var(--dark)',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
                }}
              >
                Si, soy yo
              </button>
              <button
                onClick={() => { setPreview(null); setWorkerId('') }}
                style={{
                  background: 'none', color: 'var(--g1)',
                  border: '1px solid var(--dark3)', borderRadius: 14, padding: '14px',
                  fontSize: 14, cursor: 'pointer', width: '100%',
                }}
              >
                No soy yo, intentar de nuevo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}