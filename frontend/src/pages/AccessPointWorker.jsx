// frontend/src/pages/AccessPointWorker.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { verifyWorkerIdAccessPoint } from '../services/api'

export default function AccessPointWorker() {
  const navigate = useNavigate()
  const {
    accessPointCompanyId, accessPointCompanyName,
    setAccessPointEmployee, clearAccessPointEmployee,
    setAccessPointCompany,
  } = useUserStore()

  const [workerId, setWorkerId] = useState('')
  const [preview, setPreview]   = useState(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSearch() {
    if (!workerId.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await verifyWorkerIdAccessPoint(workerId.trim(), Number(accessPointCompanyId))
      setPreview(data)
    } catch (err) {
      setError(err.message || 'ID no encontrado.')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    setAccessPointEmployee(preview.employee_id, preview.name)
    navigate('/access-point/capture')
  }

  function handleReset() {
    // Permite cambiar la empresa del punto de acceso
    localStorage.removeItem('soberlens_ap_company_id')
    localStorage.removeItem('soberlens_ap_company_name')
    localStorage.removeItem('soberlens_ap_access_code')
    navigate('/access-point/setup')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar">
        <div style={{ width: 60 }} />
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Punto de acceso</span>
        <button
          onClick={handleReset}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--g1)', fontSize: 11 }}
        >
          Cambiar empresa
        </button>
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px 40px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Empresa activa */}
        <div style={{
          background: 'var(--dark2)', border: '1px solid var(--dark3)',
          borderRadius: 16, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(0,201,167,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--g1)', marginBottom: 2 }}>
              Empresa activa
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>
              {accessPointCompanyName}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 8 }}>
            Ingresa tu ID de trabajador
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            El numero o clave que aparece en tu credencial o contrato.
          </div>
        </div>

        <input
          value={workerId}
          onChange={e => { setWorkerId(e.target.value); setError(''); setPreview(null) }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Ej. EMP001"
          autoFocus
          style={{
            background: 'var(--dark2)',
            border: `1px solid ${error ? '#ef4444' : 'var(--dark3)'}`,
            borderRadius: 12, padding: '14px 16px',
            fontSize: 16, color: 'var(--white)',
            outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
        {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}

        {preview && (
          <div style={{
            background: 'var(--dark2)', border: '1px solid var(--teal)',
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 4 }}>
              Empleado encontrado
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>
              {preview.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--g1)', marginTop: 4 }}>
              {[preview.area, preview.shift].filter(Boolean).join(' · ')}
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
                fontSize: 15, fontWeight: 700, width: '100%',
                cursor: workerId.trim() ? 'pointer' : 'default',
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
                Iniciar verificacion
              </button>
              <button
                onClick={() => { setPreview(null); setWorkerId('') }}
                style={{
                  background: 'none', color: 'var(--g1)',
                  border: '1px solid var(--dark3)', borderRadius: 14, padding: '14px',
                  fontSize: 14, cursor: 'pointer', width: '100%',
                }}
              >
                No soy yo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}