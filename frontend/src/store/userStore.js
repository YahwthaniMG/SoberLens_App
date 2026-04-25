import { create } from 'zustand'

function getOrCreateDeviceId() {
  let id = localStorage.getItem('soberlens_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('soberlens_device_id', id)
  }
  return id
}

function loadConsent(deviceId) {
  try {
    const raw = localStorage.getItem(`soberlens_consent_${deviceId}`)
    return raw ? JSON.parse(raw) : { processing: false, retraining: false }
  } catch {
    return { processing: false, retraining: false }
  }
}

const deviceId = getOrCreateDeviceId()
const consent = loadConsent(deviceId)

const useUserStore = create((set, get) => ({
  deviceId,

  consentProcessing: consent.processing,
  consentRetraining: consent.retraining,

  emergencyContact: localStorage.getItem(`soberlens_contact_${deviceId}`) || '',
  faceRegistered: localStorage.getItem(`soberlens_face_${deviceId}`) === 'true',
  name: localStorage.getItem(`soberlens_name_${deviceId}`) || '',
  ageRange: localStorage.getItem(`soberlens_age_${deviceId}`) || '',

  setProfile: (name, ageRange) => {
    const id = get().deviceId
    localStorage.setItem(`soberlens_name_${id}`, name)
    localStorage.setItem(`soberlens_age_${id}`, ageRange)
    set({ name, ageRange })
  },

  setConsent: (processing, retraining) => {
    const id = get().deviceId
    localStorage.setItem(
      `soberlens_consent_${id}`,
      JSON.stringify({ processing, retraining })
    )
    set({ consentProcessing: processing, consentRetraining: retraining })
  },

  setEmergencyContact: (contact) => {
    const id = get().deviceId
    localStorage.setItem(`soberlens_contact_${id}`, contact)
    set({ emergencyContact: contact })
  },

  setFaceRegistered: (value) => {
    const id = get().deviceId
    localStorage.setItem(`soberlens_face_${id}`, String(value))
    set({ faceRegistered: value })
  },

  // Crea un perfil nuevo con un device_id diferente.
  // Usado cuando otro usuario quiere registrarse en el mismo navegador.
  switchToNewProfile: () => {
    const newId = crypto.randomUUID()
    localStorage.setItem('soberlens_device_id', newId)
    set({
      deviceId: newId,
      consentProcessing: false,
      consentRetraining: false,
      emergencyContact: '',
      faceRegistered: false,
    })
  },

  isOnboardingComplete: () => {
    const s = get()
    return s.consentProcessing && s.faceRegistered
  },
}))

export default useUserStore