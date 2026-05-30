// frontend/src/pages/AdminLogin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { loginCompany } from '../services/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { setAdminSession } = useUserStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Ingresa tu correo y contrasena.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await loginCompany(email, password)
      setAdminSession(data.token, data.company_id, data.name, data.access_code)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)', justifyContent: 'center' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Cancelar
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Acceso administrador</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px 40px',
        display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center',
      }}>
        {/* Icono */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 6 }}>
            Panel de administracion
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)' }}>
            Ingresa con las credenciales de tu empresa
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--g1)', fontWeight: 500 }}>
              Correo electronico
            </div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="admin@empresa.com"
              style={{
                background: 'var(--dark2)', border: '1px solid var(--dark3)',
                borderRadius: 12, padding: '13px 14px',
                fontSize: 14, color: 'var(--white)', outline: 'none',
                width: '100%', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--g1)', fontWeight: 500 }}>
              Contrasena
            </div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Tu contrasena"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                background: 'var(--dark2)', border: '1px solid var(--dark3)',
                borderRadius: 12, padding: '13px 14px',
                fontSize: 14, color: 'var(--white)', outline: 'none',
                width: '100%', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: '#818cf8', color: 'var(--white)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', width: '100%',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <button
            onClick={() => navigate('/admin/register')}
            style={{
              background: 'none', color: 'var(--g1)',
              border: '1px solid var(--dark3)', borderRadius: 14, padding: '14px',
              fontSize: 14, cursor: 'pointer', width: '100%',
            }}
          >
            Registrar nueva empresa
          </button>
        </div>
      </div>
    </div>
  )
}