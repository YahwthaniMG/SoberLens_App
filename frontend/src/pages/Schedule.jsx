// frontend/src/pages/Schedule.jsx
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions } from '../services/api'

const DAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function resultDayColor(result) {
  if (result === 'drunk')   return '#EF4444'
  if (result === 'caution') return '#F59E0B'
  if (result === 'sober')   return '#00C9A7'
  return null
}

function resultDayLabel(result) {
  if (result === 'sober')   return 'Apto'
  if (result === 'drunk')   return 'No apto'
  if (result === 'caution') return 'Precaucion'
  return null
}

function buildSessionHistory(sessions) {
  const byDay = {}
  const PRIORITY = { drunk: 3, caution: 2, sober: 1 }
  for (const s of sessions) {
    const d = s.created_at.slice(0, 10)
    if (!byDay[d] || (PRIORITY[s.result] || 0) > (PRIORITY[byDay[d]] || 0)) {
      byDay[d] = s.result
    }
  }
  return byDay
}

const navBtnStyle = {
  background: 'var(--dark2)', border: '1px solid var(--dark3)',
  borderRadius: 10, width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}

export default function Schedule() {
  const navigate = useNavigate()
  const today    = new Date()

  const [currentDate, setCurrentDate]     = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay]     = useState(null)
  const [sessionHistory, setSessionHistory] = useState({})

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    getSessions(200, 0)
      .then(data => setSessionHistory(buildSessionHistory(data.sessions || [])))
      .catch(() => {})
  }, [])

  const calendarDays = useMemo(() => {
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev  = new Date(year, month, 0).getDate()

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

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const days = Object.entries(sessionHistory).filter(([d]) => d.startsWith(prefix))
    return {
      sober:   days.filter(([, r]) => r === 'sober').length,
      caution: days.filter(([, r]) => r === 'caution').length,
      drunk:   days.filter(([, r]) => r === 'drunk').length,
    }
  }, [sessionHistory, year, month])

  const todayStr   = toDateString(today)
  const isToday    = date => toDateString(date) === todayStr
  const isSelected = date => selectedDay && toDateString(date) === toDateString(selectedDay)

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }

  function formatSelectedDate(date) {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }

  const selectedDateStr    = selectedDay ? toDateString(selectedDay) : null
  const selectedResult     = selectedDateStr ? sessionHistory[selectedDateStr] || null : null

  return (
    <div className="screen" style={{ background: 'var(--dark)', overflowY: 'auto' }}>
      <div className="status-bar" style={{ color: 'var(--g1)', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--teal)', fontSize: 13 }}
        >
          Volver
        </button>
        <span style={{ fontSize: 11, color: 'var(--g1)' }}>Historial</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Cabecera del mes */}
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '4px 0' }}>
          <button onClick={prevMonth} style={navBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4L6 8l4 4"/>
            </svg>
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)', letterSpacing: -0.3 }}>
              {MONTHS[month]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--g1)', fontFamily: 'var(--mono)' }}>
              {year}
            </div>
          </div>
          <button onClick={nextMonth} style={navBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 4l4 4-4 4"/>
            </svg>
          </button>
        </div>

        {/* Stats del mes */}
        {(monthStats.sober + monthStats.caution + monthStats.drunk) > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Apto',      count: monthStats.sober,   color: '#00C9A7' },
              { label: 'Precaucion', count: monthStats.caution, color: '#F59E0B' },
              { label: 'No apto',   count: monthStats.drunk,   color: '#EF4444' },
            ].map(({ label, count, color }) => count > 0 && (
              <div key={label} style={{
                flex: 1, background: 'var(--dark2)', borderRadius: 12, padding: '8px 10px',
                border: `1px solid ${color}30`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 9, color: 'var(--g1)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Dias de la semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DAYS_SHORT.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: 'var(--g1)', padding: '4px 0',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grilla del calendario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map(({ date, current }, idx) => {
            const dateStr     = toDateString(date)
            const sessionResult = sessionHistory[dateStr] || null
            const color       = sessionResult ? resultDayColor(sessionResult) : null
            const selected    = isSelected(date)
            const isT         = isToday(date)

            return (
              <button
                key={idx}
                onClick={() => current && setSelectedDay(date)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  border: selected
                    ? '2px solid var(--teal)'
                    : isT
                    ? '1.5px solid var(--teal)'
                    : '1px solid transparent',
                  background: color
                    ? `${color}20`
                    : selected
                    ? 'var(--dark2)'
                    : 'var(--dark2)',
                  cursor: current ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  opacity: current ? 1 : 0.25,
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: isT ? 800 : 500,
                  color: color ? color : isT ? 'var(--teal)' : 'var(--white)',
                }}>
                  {date.getDate()}
                </span>
                {color && (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%', background: color,
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Panel del dia seleccionado */}
        {selectedDay && (
          <div style={{
            background: 'var(--dark2)', borderRadius: 16, padding: 16,
            border: '1px solid var(--dark3)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)',
              marginBottom: 12, textTransform: 'capitalize' }}>
              {formatSelectedDate(selectedDay)}
            </div>

            {selectedResult ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: `${resultDayColor(selectedResult)}12`,
                borderRadius: 10,
                border: `1px solid ${resultDayColor(selectedResult)}30`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: resultDayColor(selectedResult),
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600,
                    color: resultDayColor(selectedResult) }}>
                    {resultDayLabel(selectedResult)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--g1)' }}>
                    Resultado de verificacion
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--g1)' }}>
                Sin verificacion registrada este dia.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px) }
          to   { opacity: 1; transform: none }
        }
      `}</style>
    </div>
  )
}