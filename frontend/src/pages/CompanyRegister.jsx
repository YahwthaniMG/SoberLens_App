// frontend/src/pages/CompanyRegister.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { registerCompany, uploadEmployeesCsv } from '../services/api'

export default function CompanyRegister() {
  const navigate = useNavigate()
  const { setAdminSession } = useUserStore()

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    name: '', industry: '', rfc: '', email: '', password: '', passwordConfirm: '',
  })
  const [csvFile, setCsvFile]     = useState(null)
  const [csvResult, setCsvResult] = useState(null)
  const [accessCode, setAccessCode] = useState('')

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password) {
      setError('Nombre, email y contrasena son obligatorios.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('Las contrasenas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await registerCompany({
        name: form.name,
        industry: form.industry || undefined,
        rfc: form.rfc || undefined,
        email: form.email,
        password: form.password,
      })
      setAdminSession(data.token, data.company_id, data.name, data.access_code)
      setAccessCode(data.access_code)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Error al registrar la empresa.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCsvUpload() {
    if (!csvFile) {
      setStep(3)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await uploadEmployeesCsv(csvFile)
      setCsvResult(result)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Error al procesar el CSV.')
    } finally {
      setLoading(false)
    }
  }

  function handleFinish() {
    navigate('/admin/dashboard')
  }

  return (
    <div className="screen" style={{ background: 'var(--dark)' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          {step === 1 ? 'Cancelar' : 'Atras'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Registrar empresa</span>
        <div style={{ fontSize: 11, color: 'var(--g1)' }}>{step}/3</div>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 28px 0' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--teal)' : 'var(--dark3)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div className="fade-up" style={{
        flex: 1, padding: '24px 28px 40px',
        display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto',
      }}>

        {/* Paso 1 — Datos de la empresa */}
        {step === 1 && (
          <>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
                letterSpacing: -0.5, marginBottom: 8 }}>
                Datos de la empresa
              </div>
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
                Esta informacion es para identificar tu organizacion en la plataforma.
              </div>
            </div>

            {[
              { name: 'name',            label: 'Nombre de la empresa *', placeholder: 'Ej. Transportes Martinez SA' },
              { name: 'industry',        label: 'Giro o industria',        placeholder: 'Ej. Transporte de carga' },
              { name: 'rfc',             label: 'RFC',                     placeholder: 'Ej. TMA120101ABC' },
              { name: 'email',           label: 'Correo electronico *',    placeholder: 'admin@empresa.com', type: 'email' },
              { name: 'password',        label: 'Contrasena *',            placeholder: 'Minimo 8 caracteres', type: 'password' },
              { name: 'passwordConfirm', label: 'Confirmar contrasena *',  placeholder: 'Repite la contrasena', type: 'password' },
            ].map(field => (
              <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--g1)', fontWeight: 500 }}>
                  {field.label}
                </div>
                <input
                  name={field.name}
                  type={field.type || 'text'}
                  value={form[field.name]}
                  onChange={handleField}
                  placeholder={field.placeholder}
                  style={{
                    background: 'var(--dark2)', border: '1px solid var(--dark3)',
                    borderRadius: 12, padding: '13px 14px',
                    fontSize: 14, color: 'var(--white)', outline: 'none',
                    width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {error && (
              <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
            )}

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleRegister}
                disabled={loading}
                style={{
                  background: 'var(--teal)', color: 'var(--dark)',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer', width: '100%',
                }}
              >
                {loading ? 'Registrando...' : 'Continuar'}
              </button>
            </div>
          </>
        )}

        {/* Paso 2 — Subir CSV de empleados */}
        {step === 2 && (
          <>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
                letterSpacing: -0.5, marginBottom: 8 }}>
                Cargar empleados
              </div>
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
                Sube un CSV con tu lista de trabajadores. Puedes hacerlo ahora o despues desde configuracion.
              </div>
            </div>

            {/* Formato esperado */}
            <div style={{
              background: 'var(--dark2)', border: '1px solid var(--dark3)',
              borderRadius: 14, padding: 16,
            }}>
              <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Formato del archivo
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--g1)',
                lineHeight: 1.8,
              }}>
                worker_id,name,area,shift<br/>
                EMP001,Juan Perez,Produccion A,Turno A<br/>
                EMP002,Maria Garcia,Logistica,Turno B
              </div>
            </div>

            {/* Selector de archivo */}
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '28px 20px',
              background: csvFile ? 'rgba(0,201,167,0.06)' : 'var(--dark2)',
              border: `2px dashed ${csvFile ? 'var(--teal)' : 'var(--dark3)'}`,
              borderRadius: 16, cursor: 'pointer',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={csvFile ? 'var(--teal)' : 'var(--g1)'}
                strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ fontSize: 13, color: csvFile ? 'var(--teal)' : 'var(--g1)',
                fontWeight: csvFile ? 600 : 400, textAlign: 'center' }}>
                {csvFile ? csvFile.name : 'Toca para seleccionar el CSV'}
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => { setCsvFile(e.target.files[0]); setError('') }}
                style={{ display: 'none' }}
              />
            </label>

            {error && (
              <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleCsvUpload}
                disabled={loading}
                style={{
                  background: 'var(--teal)', color: 'var(--dark)',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer', width: '100%',
                }}
              >
                {loading ? 'Subiendo...' : csvFile ? 'Subir empleados' : 'Continuar sin CSV'}
              </button>
            </div>
          </>
        )}

        {/* Paso 3 — Codigo de acceso generado */}
        {step === 3 && (
          <>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)',
                letterSpacing: -0.5, marginBottom: 8 }}>
                Empresa registrada
              </div>
              <div style={{ fontSize: 13, color: 'var(--g1)', lineHeight: 1.6 }}>
                Comparte este codigo con tus empleados para que puedan unirse desde la app.
              </div>
            </div>

            {/* Codigo de acceso */}
            <div style={{
              background: 'var(--dark2)', border: '1px solid var(--teal)',
              borderRadius: 18, padding: '28px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase',
                letterSpacing: 1, fontWeight: 600 }}>
                Codigo de empresa
              </div>
              <div style={{
                fontSize: 36, fontWeight: 900, color: 'var(--white)',
                letterSpacing: 6, fontFamily: 'var(--mono)',
              }}>
                {accessCode}
              </div>
              <div style={{ fontSize: 11, color: 'var(--g1)', textAlign: 'center' }}>
                Tus empleados lo necesitan para registrarse
              </div>
            </div>

            {/* Resultado del CSV */}
            {csvResult && (
              <div style={{
                background: 'var(--dark2)', border: '1px solid var(--dark3)',
                borderRadius: 14, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 1 }}>
                  Resultado del CSV
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>
                      {csvResult.created}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--g1)' }}>Creados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>
                      {csvResult.updated}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--g1)' }}>Actualizados</div>
                  </div>
                  {csvResult.errors?.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>
                        {csvResult.errors.length}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--g1)' }}>Errores</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleFinish}
                style={{
                  background: 'var(--teal)', color: 'var(--dark)',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
                }}
              >
                Ir al panel de administracion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}