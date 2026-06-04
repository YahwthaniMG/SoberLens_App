// frontend/src/pages/RoleSelection.jsx
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'

export default function RoleSelection() {
  const navigate = useNavigate()
  const { setRole, employeeId, faceRegistered, consentGiven,
          adminToken, role } = useUserStore()

  function handleEmployee() {
    setRole('employee')
    const stored = {
      employeeId:    localStorage.getItem('soberlens_employee_id'),
      faceRegistered: localStorage.getItem('soberlens_face_registered') === 'true',
      consentGiven:   localStorage.getItem('soberlens_consent_given') === 'true',
    }
    if (stored.employeeId && stored.faceRegistered && stored.consentGiven) {
      navigate('/dashboard')
      return
    }
    if (stored.employeeId && !stored.faceRegistered) {
      navigate('/register-face')
      return
    }
    if (stored.employeeId && !stored.consentGiven) {
      navigate('/consent')
      return
    }
    navigate('/join')
  }

  function handleAdmin() {
    setRole('admin')
    if (adminToken) {
      navigate('/admin/dashboard')
      return
    }
    navigate('/admin/login')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)', justifyContent: 'center' }}>
      <div className="fade-up" style={{
        padding: '0 28px',
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--teal), var(--teal-d))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"
              stroke="var(--dark)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="16" cy="10" r="5" />
              <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" />
            </svg>
          </div>
          <div style={{
            fontSize: 26, fontWeight: 800, color: 'var(--white)',
            letterSpacing: -0.5, marginBottom: 6,
          }}>
            SoberLens
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.5 }}>
            Verificacion de aptitud laboral
          </div>
        </div>

        {/* Selector de rol */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--g1)', textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 4 }}>
            Selecciona tu rol
          </div>

          <button
            onClick={handleEmployee}
            style={{
              background: 'var(--dark2)', border: '1px solid var(--dark3)',
              borderRadius: 16, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(0,201,167,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="7" r="4" />
                <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)',
                marginBottom: 2 }}>
                Soy empleado
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.4 }}>
                {employeeId && faceRegistered && consentGiven
                  ? 'Continuar con mi sesion activa'
                  : 'Accedo con el codigo de mi empresa'}
              </div>
            </div>
            <svg style={{ marginLeft: 'auto', flexShrink: 0 }}
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>

          <button
            onClick={handleAdmin}
            style={{
              background: 'var(--dark2)', border: '1px solid var(--dark3)',
              borderRadius: 16, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(99,102,241,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#818cf8" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)',
                marginBottom: 2 }}>
                Soy administrador
              </div>
              <div style={{ fontSize: 12, color: 'var(--g1)', lineHeight: 1.4 }}>
                {adminToken
                  ? 'Continuar con mi sesion activa'
                  : 'Gestiono el equipo de mi empresa'}
              </div>
            </div>
            <svg style={{ marginLeft: 'auto', flexShrink: 0 }}
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="var(--g1)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--g1)' }}>
          <span
            onClick={() => navigate('/privacy')}
            style={{ color: 'var(--teal)', cursor: 'pointer' }}
          >
            Aviso de privacidad
          </span>
        </div>
      </div>
    </div>
  )
}