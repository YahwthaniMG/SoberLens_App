// frontend/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------

function getDeviceId() {
  return localStorage.getItem('soberlens_device_id') || ''
}

function getAdminToken() {
  return localStorage.getItem('soberlens_admin_token') || ''
}

function employeeHeaders(extra = {}) {
  const employeeId = localStorage.getItem('soberlens_employee_id') || ''
  const companyId  = localStorage.getItem('soberlens_company_id')  || ''
  return {
    'X-Device-ID':   getDeviceId(),
    'X-Employee-ID': employeeId,
    'X-Company-ID':  companyId,
    ...extra,
  }
}

function adminHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${getAdminToken()}`,
    ...extra,
  }
}

function baseHeaders(extra = {}) {
  return { 'X-Device-ID': getDeviceId(), ...extra }
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = err.detail
    if (detail && typeof detail === 'object') {
      throw new Error(detail.message || `Error ${res.status}`)
    }
    throw new Error(detail || `Error ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Empleado — registro
// ---------------------------------------------------------------------------

export async function joinCompany(accessCode) {
  const res = await fetch(`${BASE_URL}/employees/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: accessCode }),
  })
  return handleResponse(res)
}

export async function verifyWorkerId(workerId, companyId) {
  const res = await fetch(`${BASE_URL}/employees/verify-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worker_id: workerId, company_id: companyId }),
  })
  return handleResponse(res)
}

export async function registerEmployeeFace(imageBlob) {
  const form = new FormData()
  form.append('frame', imageBlob, 'face.jpg')
  const res = await fetch(`${BASE_URL}/employees/register`, {
    method: 'POST',
    headers: employeeHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function getEmployeeMe() {
  const res = await fetch(`${BASE_URL}/employees/me`, {
    headers: employeeHeaders(),
  })
  return handleResponse(res)
}

// ---------------------------------------------------------------------------
// Analisis — B2B (envia headers de empleado)
// ---------------------------------------------------------------------------

export async function analyzeFrames(frameBlobs) {
  const form = new FormData()
  frameBlobs.forEach((blob, i) => form.append('frames', blob, `frame_${i}.jpg`))
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: employeeHeaders(),
    body: form,
  })
  return handleResponse(res)
}

// ---------------------------------------------------------------------------
// Sesiones
// ---------------------------------------------------------------------------

export async function getSessions(limit = 30, offset = 0) {
  const employeeId = localStorage.getItem('soberlens_employee_id') || ''
  const res = await fetch(
    `${BASE_URL}/sessions?limit=${limit}&offset=${offset}`,
    { headers: employeeHeaders() }
  )
  return handleResponse(res)
}

// ---------------------------------------------------------------------------
// Admin — empresa
// ---------------------------------------------------------------------------

export async function registerCompany(data) {
  const res = await fetch(`${BASE_URL}/companies/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function loginCompany(email, password) {
  const res = await fetch(`${BASE_URL}/companies/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse(res)
}

export async function getCompanyMe() {
  const res = await fetch(`${BASE_URL}/companies/me`, {
    headers: adminHeaders(),
  })
  return handleResponse(res)
}

export async function updateCompanySettings(alertContacts) {
  const res = await fetch(`${BASE_URL}/companies/settings`, {
    method: 'PATCH',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ alert_contacts: alertContacts }),
  })
  return handleResponse(res)
}

export async function uploadEmployeesCsv(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/companies/employees/upload`, {
    method: 'POST',
    headers: adminHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function getAdminDashboard() {
  const res = await fetch(`${BASE_URL}/companies/dashboard`, {
    headers: adminHeaders(),
  })
  return handleResponse(res)
}

export async function getEmployeeHistory(employeeId, limit = 30, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/companies/employees/${employeeId}/history?limit=${limit}&offset=${offset}`,
    { headers: adminHeaders() }
  )
  return handleResponse(res)
}

export async function secondVerify(sessionId, result) {
  const res = await fetch(
    `${BASE_URL}/sessions/${sessionId}/second-verify?result=${result}`,
    { method: 'PATCH', headers: adminHeaders() }
  )
  return handleResponse(res)
}

// ---------------------------------------------------------------------------
// Identity — registro facial (B2C legacy, sigue siendo usado en /identity/register)
// ---------------------------------------------------------------------------

export async function registerFace(imageBlob) {
  const form = new FormData()
  form.append('frame', imageBlob, 'face.jpg')
  const res = await fetch(`${BASE_URL}/identity/register`, {
    method: 'POST',
    headers: baseHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function verifyFace(imageBlob) {
  const form = new FormData()
  form.append('frame', imageBlob, 'face.jpg')
  const res = await fetch(`${BASE_URL}/identity/verify`, {
    method: 'POST',
    headers: employeeHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function getCompanyEmployees(area = '', shift = '') {
  const params = new URLSearchParams()
  if (area)  params.append('area', area)
  if (shift) params.append('shift', shift)
  const res = await fetch(`${BASE_URL}/companies/employees?${params}`, {
    headers: adminHeaders(),
  })
  return handleResponse(res)
}