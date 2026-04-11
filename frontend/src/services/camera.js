// Acceso a camara, captura de foto y extraccion de frames para analisis

// ---------------------------------------------------------------------------
// Camara
// ---------------------------------------------------------------------------

export async function startCamera(videoElement, facingMode = 'user') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })
  videoElement.srcObject = stream
  await videoElement.play()
  return stream
}

export function stopCamera(stream) {
  if (!stream) return
  stream.getTracks().forEach(track => track.stop())
}

// ---------------------------------------------------------------------------
// Captura de foto unica (para registro facial)
// ---------------------------------------------------------------------------

export function capturePhoto(videoElement) {
  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
}

// ---------------------------------------------------------------------------
// Captura de 18 frames en 5 segundos (para analisis)
// ---------------------------------------------------------------------------

export function captureFrames(videoElement, count = 18, durationMs = 5000) {
  return new Promise((resolve, reject) => {
    const frames = []
    const interval = durationMs / count
    let captured = 0

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')

    const timer = setInterval(async () => {
      try {
        ctx.drawImage(videoElement, 0, 0)
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85))
        frames.push(blob)
        captured++

        if (captured >= count) {
          clearInterval(timer)
          resolve(frames)
        }
      } catch (err) {
        clearInterval(timer)
        reject(err)
      }
    }, interval)
  })
}