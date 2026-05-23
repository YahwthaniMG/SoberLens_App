// frontend/src/pages/EmployeeJoin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { joinCompany } from '../services/api'

export default function EmployeeJoin() {
  const navigate     = useNavigate()
  const { setCompany } = useUserStore()

  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  function formatCode(raw) {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (clean.length <= 4) return clean
    return clean.slice(0, 4) + '-' + clean.slice(4, 8)
  }

  function handleChange(e) {
    const formatted = formatCode(e.target.value)
    setCode(formatted)
    setError('')
    setPreview(null)
  }

  async function handleSearch() {
    if (code.length < 9) {
      setError('El codigo debe tener el formato XXXX-9999.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await joinCompany(code)
      setPreview(data)
    } catch (err) {
      setError(err.message || 'Codigo no valido.')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    setCompany(preview.company_id, preview.company_name)
    navigate('/verify-id')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Unirse a empresa</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 8 }}>
            Codigo de empresa
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            Solicita el codigo a tu supervisor o administrador. Tiene el formato XXXX-9999.
          </div>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={code}
            onChange={handleChange}
            maxLength={9}
            placeholder="XXXX-9999"
            style={{
              background: 'var(--dark2)', border: `1px solid ${error ? '#ef4444' : 'var(--dark3)'}`,
              borderRadius: 12, padding: '14px 16px',
              fontSize: 22, fontWeight: 700, color: 'var(--white)',
              letterSpacing: 4, textAlign: 'center',
              outline: 'none', width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--mono)',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
          )}
        </div>

        {/* Preview de empresa */}
        {preview && (
          <div style={{
            background: 'var(--dark2)', border: '1px solid var(--teal)',
            borderRadius: 16, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 4 }}>
              Empresa encontrada
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
              {preview.company_name}
            </div>
            {preview.industry && (
              <div style={{ fontSize: 13, color: 'var(--g1)' }}>{preview.industry}</div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!preview ? (
            <button
              onClick={handleSearch}
              disabled={loading || code.length < 9}
              style={{
                background: code.length === 9 ? 'var(--teal)' : 'var(--dark3)',
                color: code.length === 9 ? 'var(--dark)' : 'var(--g1)',
                border: 'none', borderRadius: 14, padding: '16px',
                fontSize: 15, fontWeight: 700, cursor: code.length === 9 ? 'pointer' : 'default',
                width: '100%',
              }}
            >
              {loading ? 'Buscando...' : 'Buscar empresa'}
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
                Si, es mi empresa
              </button>
              <button
                onClick={() => { setPreview(null); setCode('') }}
                style={{
                  background: 'none', color: 'var(--g1)',
                  border: '1px solid var(--dark3)', borderRadius: 14, padding: '14px',
                  fontSize: 14, cursor: 'pointer', width: '100%',
                }}
              >
                No es esta, intentar de nuevo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}