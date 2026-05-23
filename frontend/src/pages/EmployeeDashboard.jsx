import { useNavigate } from 'react-router-dom'
export default function EmployeeDashboard() {
  const navigate = useNavigate()
  return (
    <div className="screen" style={{ background: 'var(--dark)', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: 'var(--white)', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
        Employee Dashboard
      </div>
      <button
        onClick={() => navigate('/capture')}
        style={{ background: 'var(--teal)', color: 'var(--dark)', border: 'none',
          borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        Iniciar verificacion
      </button>
    </div>
  )
}