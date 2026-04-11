export default function Dashboard() {
  return (
    <div className="screen fade-up" style={{
      background: 'var(--dark)',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--g1)', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          <span style={{ color: 'var(--teal)' }}>✓</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
          Registro completo
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          Dashboard — Sprint 3
        </div>
      </div>
    </div>
  )
}