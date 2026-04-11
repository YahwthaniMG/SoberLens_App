const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getDeviceId() {
  return localStorage.getItem('soberlens_device_id') || ''
}

function headers(extra = {}) {
  return {
    'X-Device-ID': getDeviceId(),
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// /analyze
// ---------------------------------------------------------------------------

export async function analyzeFrames(frameBlobs) {
  const form = new FormData()
  frameBlobs.forEach((blob, i) => {
    form.append('frames', blob, `frame_${i}.jpg`)
  })

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// /identity
// ---------------------------------------------------------------------------

export async function registerFace(imageBlob) {
  const form = new FormData()
  form.append('frame', imageBlob, 'face.jpg')

  const res = await fetch(`${BASE_URL}/identity/register`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function verifyFace(imageBlob) {
  const form = new FormData()
  form.append('frame', imageBlob, 'face.jpg')

  const res = await fetch(`${BASE_URL}/identity/verify`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// /sessions
// ---------------------------------------------------------------------------

export async function getSessions(limit = 20, offset = 0) {
  const res = await fetch(
    `${BASE_URL}/sessions?limit=${limit}&offset=${offset}`,
    { headers: headers() }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function confirmSession(sessionId, correct) {
  const res = await fetch(
    `${BASE_URL}/sessions/${sessionId}/confirm?correct=${correct}`,
    { method: 'PATCH', headers: headers() }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// /notify
// ---------------------------------------------------------------------------

export async function sendAlert(sessionId, emergencyContact) {
  const res = await fetch(`${BASE_URL}/notify`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      session_id: sessionId,
      emergency_contact: emergencyContact || undefined,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}