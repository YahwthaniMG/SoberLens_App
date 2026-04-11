import { create } from 'zustand'

// Genera o recupera el device_id del localStorage
function getOrCreateDeviceId() {
  let id = localStorage.getItem('soberlens_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('soberlens_device_id', id)
  }
  return id
}

const useUserStore = create((set, get) => ({
  // Identidad
  deviceId: getOrCreateDeviceId(),

  // Consentimientos
  consentProcessing: false,   // obligatorio
  consentRetraining: false,   // opcional

  // Perfil
  emergencyContact: localStorage.getItem('soberlens_contact') || '',
  faceRegistered: localStorage.getItem('soberlens_face_registered') === 'true',

  // Acciones
  setConsent: (processing, retraining) => set({
    consentProcessing: processing,
    consentRetraining: retraining,
  }),

  setEmergencyContact: (contact) => {
    localStorage.setItem('soberlens_contact', contact)
    set({ emergencyContact: contact })
  },

  setFaceRegistered: (value) => {
    localStorage.setItem('soberlens_face_registered', String(value))
    set({ faceRegistered: value })
  },

  // Verifica si el usuario completo el onboarding
  isOnboardingComplete: () => {
    const s = get()
    return s.consentProcessing && s.faceRegistered
  },
}))

export default useUserStore