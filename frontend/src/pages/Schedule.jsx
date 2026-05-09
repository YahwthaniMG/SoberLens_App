import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadEvents, addEvent, removeEvent,
  AUTO_REMINDER_DAYS, toDateString, buildSessionHistory,
} from '../services/events'
import { getSessions } from '../services/api'

const DAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function resultDayColor(result) {
  if (result === 'drunk') return '#EF4444'
  if (result === 'caution') return '#F59E0B'
  if (result === 'sober') return '#00C9A7'
  return null
}

export default function Schedule() {
  const navigate = useNavigate()
  const today = new Date()

  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState(loadEvents)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [sessionHistory, setSessionHistory] = useState({}) // { "YYYY-MM-DD": result }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Cargar historial de sesiones del backend
  useEffect(() => {
    getSessions(100, 0)
      .then(data => {
        const history = buildSessionHistory(data.sessions || [])
        setSessionHistory(history)
      })
      .catch(() => {})
  }, [])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()

    const cells = []
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, daysInPrev - i), current: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), current: true })
    }
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ date: new Date(year, month + 1, d), current: false })
      }
    }
    return cells
  }, [year, month])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }

  function getDayMarkers(date) {
    const dateStr = toDateString(date)
    const isAuto = AUTO_REMINDER_DAYS.has(date.getDay())
    const customEvents = events.filter(e => e.date === dateStr)
    const sessionResult = sessionHistory[dateStr] || null
    return { isAuto, customEvents, sessionResult }
  }

  function handleDayClick(date) {
    setSelectedDay(date)
    setShowForm(false)
    setNewTitle('')
  }

  function handleAddEvent() {
    if (!newTitle.trim() || !selectedDay) return
    const event = addEvent(newTitle, toDateString(selectedDay))
    setEvents(prev => [...prev, event])
    setNewTitle('')
    setShowForm(false)
  }

  function handleRemove(id) {
    removeEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const todayStr = toDateString(today)
  const isToday = date => toDateString(date) === todayStr
  const isSelected = date => selectedDay && toDateString(date) === toDateString(selectedDay)
  const isFuture = date => toDateString(date) > todayStr

  const selectedDateStr = selectedDay ? toDateString(selectedDay) : null
  const selectedMarkers = selectedDay ? getDayMarkers(selectedDay) : null
  const selectedEvents = selectedDay ? events.filter(e => e.date === selectedDateStr) : []

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [events, todayStr])

  function formatSelectedDate(date) {
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatEventDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  // Estadisticas del mes visible
  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const days = Object.entries(sessionHistory).filter(([d]) => d.startsWith(prefix))
    return {
      sober: days.filter(([, r]) => r === 'sober').length,
      caution: days.filter(([, r]) => r === 'caution').length,
      drunk: days.filter(([, r]) => r === 'drunk').length,
    }
  }, [sessionHistory, year, month])

  return (
    <div className="screen" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      <div className="status-bar" style={{ color: 'var(--g1)', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Recordatorios</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Cabecera del mes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <button onClick={prevMonth} style={navBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4L6 8l4 4"/>
            </svg>
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.3 }}>
              {MONTHS[month]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--g1)', fontFamily: 'var(--mono)' }}>{year}</div>
          </div>
          <button onClick={nextMonth} style={navBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 4l4 4-4 4"/>
            </svg>
          </button>
        </div>

        {/* Estadisticas del mes */}
        {(monthStats.sober + monthStats.caution + monthStats.drunk) > 0 && (
          <div style={{
            display: 'flex', gap: 8,
          }}>
            {[
              { label: 'Sobrio', count: monthStats.sober, color: '#00C9A7' },
              { label: 'Precaucion', count: monthStats.caution, color: '#F59E0B' },
              { label: 'Ebrio', count: monthStats.drunk, color: '#EF4444' },
            ].map(({ label, count, color }) => count > 0 && (
              <div key={label} style={{
                flex: 1, background: 'var(--dark2)', borderRadius: 12, padding: '8px 10px',
                border: `1px solid ${color}30`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 9, color: 'var(--g1)' }}>dias {label.toLowerCase()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#00C9A7', label: 'Sobrio' },
            { color: '#EF4444', label: 'Ebrio' },
            { color: '#F59E0B', label: 'Precaucion' },
            { color: 'var(--teal)', label: 'Recordatorio (V/S/D)', dot: true },
            { color: '#A78BFA', label: 'Evento', dot: true },
          ].map(({ color, label, dot }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--g1)' }}>
              <div style={{
                width: dot ? 6 : 10, height: dot ? 6 : 10,
                borderRadius: dot ? '50%' : 3,
                background: color,
              }} />
              {label}
            </div>
          ))}
        </div>

        {/* Grilla */}
        <div style={{ background: 'var(--dark2)', borderRadius: 20, padding: '12px 8px', border: '1px solid var(--dark3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--g1)', fontWeight: 600, padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
            {calendarDays.map(({ date, current }, i) => {
              const { isAuto, customEvents: dayCustom, sessionResult } = getDayMarkers(date)
              const hasCustom = dayCustom.length > 0
              const selected = isSelected(date)
              const todayDay = isToday(date)
              const future = isFuture(date)
              const dayColor = current && !future && !todayDay ? resultDayColor(sessionResult) : null

              return (
                <button
                  key={i}
                  onClick={() => current && handleDayClick(date)}
                  style={{
                    background: selected
                      ? 'rgba(255,255,255,0.15)'
                      : dayColor
                      ? `${dayColor}22`
                      : todayDay
                      ? 'rgba(255,255,255,0.08)'
                      : 'transparent',
                    border: selected
                      ? '1.5px solid rgba(255,255,255,0.5)'
                      : todayDay
                      ? '1.5px solid rgba(255,255,255,0.3)'
                      : dayColor
                      ? `1.5px solid ${dayColor}55`
                      : '1.5px solid transparent',
                    borderRadius: 10,
                    padding: '6px 2px',
                    cursor: current ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    minHeight: 44,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{
                    fontSize: 13,
                    fontWeight: todayDay || selected ? 800 : 400,
                    color: dayColor && !selected
                      ? dayColor
                      : !current
                      ? 'var(--dark3)'
                      : future
                      ? 'var(--g1)'
                      : 'var(--white)',
                  }}>
                    {date.getDate()}
                  </span>
                  {current && (isAuto || hasCustom) && !future && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {isAuto && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--teal)' }} />
                      )}
                      {hasCustom && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#A78BFA' }} />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel del dia seleccionado */}
        {selectedDay && (
          <div style={{
            background: 'var(--dark2)', borderRadius: 16, padding: 16,
            border: '1px solid var(--dark3)', animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)', marginBottom: 12, textTransform: 'capitalize' }}>
              {formatSelectedDate(selectedDay)}
            </div>

            {/* Resultado del dia si existe */}
            {selectedMarkers.sessionResult && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                background: `${resultDayColor(selectedMarkers.sessionResult)}12`,
                borderRadius: 10,
                border: `1px solid ${resultDayColor(selectedMarkers.sessionResult)}30`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: resultDayColor(selectedMarkers.sessionResult),
                }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: resultDayColor(selectedMarkers.sessionResult) }}>
                    {selectedMarkers.sessionResult === 'sober' ? 'Sobrio' : selectedMarkers.sessionResult === 'drunk' ? 'Ebrio' : 'Precaucion'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--g1)' }}>Resultado de verificacion</div>
                </div>
              </div>
            )}

            {selectedMarkers.isAuto && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                background: 'rgba(0,201,167,0.08)', borderRadius: 10,
                border: '1px solid rgba(0,201,167,0.2)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}>Recordatorio automatico</div>
                  <div style={{ fontSize: 10, color: 'var(--g1)' }}>Viernes, sabado y domingo son dias de alto riesgo</div>
                </div>
              </div>
            )}

            {selectedEvents.map(e => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', marginBottom: 8,
                background: 'rgba(167,139,250,0.08)', borderRadius: 10,
                border: '1px solid rgba(167,139,250,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A78BFA', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--white)' }}>{e.title}</span>
                </div>
                <button
                  onClick={() => handleRemove(e.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g1)', padding: 4 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 2l10 10M12 2L2 12"/>
                  </svg>
                </button>
              </div>
            ))}

            {!selectedMarkers.sessionResult && !selectedMarkers.isAuto && selectedEvents.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--g1)', marginBottom: 8 }}>
                {isFuture(selectedDay) ? 'Dia sin eventos programados.' : 'Sin verificacion registrada este dia.'}
              </div>
            )}

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%', marginTop: 4,
                  background: 'transparent', border: '1px dashed var(--dark3)',
                  borderRadius: 10, padding: '8px 12px',
                  color: 'var(--g1)', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 1v10M1 6h10"/>
                </svg>
                Agregar evento
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                  placeholder="Nombre del evento..."
                  style={{
                    flex: 1, background: 'var(--dark3)', border: '1px solid var(--teal)',
                    borderRadius: 10, padding: '8px 12px', color: 'var(--white)',
                    fontSize: 12, fontFamily: 'var(--font)', outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddEvent}
                  disabled={!newTitle.trim()}
                  style={{
                    background: newTitle.trim() ? 'var(--teal)' : 'var(--dark3)',
                    color: newTitle.trim() ? 'var(--dark)' : 'var(--g1)',
                    border: 'none', borderRadius: 10, padding: '8px 14px',
                    fontWeight: 700, fontSize: 12, cursor: newTitle.trim() ? 'pointer' : 'default',
                  }}
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setShowForm(false); setNewTitle('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g1)', padding: '8px 4px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 2l10 10M12 2L2 12"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Proximos eventos */}
        {upcomingEvents.length > 0 && (
          <div style={{ background: 'var(--dark2)', borderRadius: 16, padding: '12px 16px', border: '1px solid var(--dark3)' }}>
            <div style={{ fontSize: 10, color: 'var(--g1)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Proximos eventos
            </div>
            {upcomingEvents.map((e, i) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--dark3)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A78BFA', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--white)' }}>{e.title}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--g1)', fontFamily: 'var(--mono)' }}>
                  {formatEventDate(e.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  )
}

const navBtnStyle = {
  background: 'var(--dark2)', border: '1px solid var(--dark3)',
  borderRadius: 10, width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}