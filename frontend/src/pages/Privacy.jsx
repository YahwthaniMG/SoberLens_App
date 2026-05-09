import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="screen" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      <div className="status-bar" style={{ color: 'var(--g1)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Privacidad</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.5 }}>
          Aviso de privacidad
        </div>

        {[
          {
            title: 'Datos que recopilamos',
            body: 'SoberLens captura imagenes de tu rostro unicamente durante el proceso de verificacion. Estas imagenes se procesan en tiempo real en el servidor y se eliminan inmediatamente — nunca se almacenan en disco. Lo que se guarda es un vector numerico (embedding) derivado de tu rostro, que no permite reconstruir la imagen original.',
          },
          {
            title: 'Como usamos tus datos',
            body: 'El embedding facial se usa exclusivamente para verificar tu identidad antes de cada captura, evitando que otra persona use la app en tu nombre. Los resultados de cada verificacion (sobrio/ebrio, porcentaje, fecha) se guardan para generar tu historial y estadisticas personales.',
          },
          {
            title: 'Datos de reentrenamiento (opcional)',
            body: 'Si aceptaste contribuir datos de entrenamiento, las sesiones con alta confianza (mas del 80% de votos) se marcan como candidatas. Al dia siguiente se te pregunta si el resultado fue correcto. Solo las sesiones que confirmas entran al dataset de reentrenamiento, completamente anonimizadas.',
          },
          {
            title: 'Contacto de emergencia',
            body: 'El numero de telefono de tu contacto de emergencia se usa unicamente para enviar alertas via WhatsApp cuando se detecta intoxicacion. No se comparte con terceros ni se usa para ningun otro fin.',
          },
          {
            title: 'Tus derechos',
            body: 'Puedes solicitar la eliminacion de todos tus datos en cualquier momento contactando al equipo de desarrollo. Tambien puedes revocar el consentimiento de reentrenamiento desde tu perfil sin afectar el funcionamiento basico de la app.',
          },
          {
            title: 'Proyecto academico',
            body: 'SoberLens es un proyecto terminal universitario desarrollado en la Universidad Panamericana, campus Mexico. Los datos recopilados tienen fines academicos y de investigacion aplicada. No existe uso comercial de la informacion.',
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{body}</div>
          </div>
        ))}

        <div style={{ fontSize: 10, color: 'var(--dark3)', paddingTop: 8 }}>
          Ultima actualizacion: Mayo 2026
        </div>
      </div>
    </div>
  )
}