// frontend/src/pages/AdminSettings.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import { getCompanyMe, updateCompanySettings, uploadEmployeesCsv } from '../services/api'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { adminAccessCode } = useUserStore()

  const [contacts, setContacts]   = useState(['', '', ''])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [csvFile, setCsvFile]     = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    getCompanyMe()
      .then(data => {
        const existing = data.alert_contacts || []
        const padded = [...existing, '', '', ''].slice(0, 3)
        setContacts(padded)
      })
      .catch(() => setError('No se pudieron cargar los datos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveContacts() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const clean = contacts.filter(c => c.trim())
      await updateCompanySettings(clean)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCsvUpload() {
    if (!csvFile) return
    setCsvLoading(true)
    setError('')
    setCsvResult(null)
    try {
      const result = await uploadEmployeesCsv(csvFile)
      setCsvResult(result)
      setCsvFile(null)
    } catch (err) {
      setError(err.message || 'Error al procesar el CSV.')
    } finally {
      setCsvLoading(false)
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--g3)', overflowY: 'auto' }}>
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
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>
          Configuracion
        </div>
      </div>

      <div style={{ padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Codigo de acceso */}
        <div style={{
          background: 'var(--white)', borderRadius: 18, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Codigo de empresa
          </div>
          <div style={{
            fontSize: 32, fontWeight: 900, color: 'var(--dark)',
            letterSpacing: 4, fontFamily: 'var(--mono)',
          }}>
            {adminAccessCode}
          </div>
          <div style={{ fontSize: 12, color: 'var(--g1)' }}>
            Comparte este codigo con tus empleados para que puedan registrarse en la app.
          </div>
        </div>

        {/* Contactos de alerta */}
        <div style={{
          background: 'var(--white)', borderRadius: 18, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Contactos de alerta SMS
          </div>
          <div style={{ fontSize: 12, color: 'var(--g1)' }}>
            Hasta 3 numeros que recibiran notificacion cuando se detecte un resultado no apto.
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--g1)' }}>Cargando...</div>
          ) : (
            contacts.map((contact, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                  Contacto {i + 1}
                </div>
                <input
                  type="tel"
                  value={contact}
                  onChange={e => {
                    const updated = [...contacts]
                    updated[i] = e.target.value
                    setContacts(updated)
                  }}
                  placeholder="+52 1 33 1234 5678"
                  style={{
                    background: 'var(--g3)', border: '1px solid var(--g3)',
                    borderRadius: 10, padding: '11px 12px',
                    fontSize: 14, color: 'var(--dark)', outline: 'none',
                    width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
          )}

          {saved && (
            <div style={{ fontSize: 12, color: 'var(--teal)' }}>
              Contactos guardados correctamente.
            </div>
          )}

          <button
            onClick={handleSaveContacts}
            disabled={saving || loading}
            style={{
              background: 'var(--teal)', color: 'var(--dark)',
              border: 'none', borderRadius: 12, padding: '13px',
              fontSize: 14, fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer', width: '100%',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar contactos'}
          </button>
        </div>

        {/* Subir empleados */}
        <div style={{
          background: 'var(--white)', borderRadius: 18, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontSize: 11, color: 'var(--g1)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Actualizar lista de empleados
          </div>
          <div style={{ fontSize: 12, color: 'var(--g1)' }}>
            Sube un nuevo CSV para agregar empleados o actualizar los existentes.
            Los registros con el mismo worker_id se actualizaran automaticamente.
          </div>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: '20px',
            background: csvFile ? 'rgba(0,201,167,0.04)' : 'var(--g3)',
            border: `2px dashed ${csvFile ? 'var(--teal)' : 'var(--g2)'}`,
            borderRadius: 14, cursor: 'pointer',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke={csvFile ? 'var(--teal)' : 'var(--g1)'}
              strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize: 12, color: csvFile ? 'var(--teal)' : 'var(--g1)',
              fontWeight: csvFile ? 600 : 400 }}>
              {csvFile ? csvFile.name : 'Seleccionar CSV'}
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={e => { setCsvFile(e.target.files[0]); setCsvResult(null) }}
              style={{ display: 'none' }}
            />
          </label>

          {csvResult && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>
                  {csvResult.created}
                </div>
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>Creados</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>
                  {csvResult.updated}
                </div>
                <div style={{ fontSize: 11, color: 'var(--g1)' }}>Actualizados</div>
              </div>
            </div>
          )}

          <button
            onClick={handleCsvUpload}
            disabled={!csvFile || csvLoading}
            style={{
              background: csvFile ? 'var(--dark)' : 'var(--g3)',
              color: csvFile ? 'var(--white)' : 'var(--g1)',
              border: 'none', borderRadius: 12, padding: '13px',
              fontSize: 14, fontWeight: 700,
              cursor: csvFile && !csvLoading ? 'pointer' : 'default', width: '100%',
            }}
          >
            {csvLoading ? 'Procesando...' : 'Subir CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}