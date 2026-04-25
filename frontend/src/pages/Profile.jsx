import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { updateProfile } from '../services/api'

const AGE_RANGES = ['18-25', '26-35', '36-45', '46+']

export default function Profile() {
  const navigate = useNavigate()
  const { setProfile } = useUserStore()

  const [name, setName] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canContinue = name.trim().length >= 2 && ageRange !== ''

  async function handleContinue() {
    setLoading(true)
    setError('')
    try {
      await updateProfile(name.trim(), ageRange)
      setProfile(name.trim(), ageRange)
      navigate('/register')
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      {/* Status bar */}
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          ← Atrás
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Tu perfil</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', gap: 24,
        overflowY: 'auto',
      }}>
        {/* Icono */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--dark3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
            stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
            <circle cx="14" cy="9" r="5"/>
            <path d="M5 24v-2a9 9 0 0118 0v2"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5, lineHeight: 1.3, marginBottom: 8 }}>
            Cuéntanos un poco sobre ti
          </div>
          <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
            Tu nombre y edad nos ayudan a personalizar la experiencia y mejorar la precisión del modelo.
          </div>
        </div>

        {/* Nombre */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g2)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Nombre
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="¿Cómo te llamas?"
            maxLength={64}
            style={{
              background: 'var(--dark2)', border: `1px solid ${name.trim().length >= 2 ? 'var(--teal)' : 'var(--dark3)'}`,
              borderRadius: 12, padding: '14px 16px',
              color: 'var(--white)', fontSize: 15,
              fontFamily: 'var(--font)', outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Rango de edad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g2)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Rango de edad
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {AGE_RANGES.map(range => (
              <button
                key={range}
                onClick={() => setAgeRange(range)}
                style={{
                  padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: ageRange === range ? 'var(--teal)' : 'var(--dark2)',
                  color: ageRange === range ? 'var(--dark)' : 'var(--g1)',
                  fontFamily: 'var(--font)', fontSize: 15, fontWeight: ageRange === range ? 700 : 400,
                  transition: 'all 0.15s',
                  outline: ageRange === range ? 'none' : `1px solid var(--dark3)`,
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Nota de privacidad */}
        <div style={{
          background: 'var(--dark3)', borderRadius: 12, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="var(--g1)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 7v4M8 5.5v.5"/>
          </svg>
          <div style={{ fontSize: 11, color: 'var(--g1)', lineHeight: 1.5 }}>
            Tu nombre y rango de edad se usan únicamente para identificarte dentro de la app. No se comparten con terceros.
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(248,81,73,.12)',
            borderRadius: 10, border: '1px solid rgba(248,81,73,.3)',
            fontSize: 12, color: 'var(--red)',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 28px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={!canContinue || loading}
        >
          {loading ? 'Guardando...' : 'Continuar'}
        </button>
        {!canContinue && (
          <div style={{ fontSize: 11, color: 'var(--g1)', textAlign: 'center' }}>
            Ingresa tu nombre y selecciona tu rango de edad para continuar.
          </div>
        )}
      </div>
    </div>
  )
}