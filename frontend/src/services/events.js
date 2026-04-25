// frontend/src/services/events.js
// Manejo de eventos de recordatorio en localStorage.
// Los dias automaticos (viernes/sabado/domingo) se calculan en tiempo real.
// Los eventos personalizados se persisten como JSON.

const STORAGE_KEY = 'soberlens_events'

// Dias de la semana que siempre tienen recordatorio automatico (0=dom, 5=vie, 6=sab)
export const AUTO_REMINDER_DAYS = new Set([0, 5, 6])

export function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function addEvent(title, date) {
  const events = loadEvents()
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    date, // YYYY-MM-DD
    type: 'custom',
    created_at: new Date().toISOString(),
  }
  events.push(event)
  saveEvents(events)
  return event
}

export function removeEvent(id) {
  const events = loadEvents().filter(e => e.id !== id)
  saveEvents(events)
}

// Retorna true si hoy es dia de recordatorio (automatico o evento personalizado)
export function hasTodayReminder() {
  const today = new Date()
  const todayStr = toDateString(today)

  if (AUTO_REMINDER_DAYS.has(today.getDay())) return true

  return loadEvents().some(e => e.date === todayStr)
}

// Retorna el evento personalizado de hoy si existe
export function getTodayEvent() {
  const todayStr = toDateString(new Date())
  return loadEvents().find(e => e.date === todayStr) || null
}

export function toDateString(date) {
  return date.toISOString().slice(0, 10)
}