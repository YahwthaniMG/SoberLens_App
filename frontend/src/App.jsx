import { Routes, Route, Navigate } from 'react-router-dom'
import useUserStore from './store/userStore'
import Onboarding from './pages/Onboarding'
import Consent from './pages/Consent'
import FaceRegistration from './pages/FaceRegistration'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { consentProcessing, faceRegistered } = useUserStore()

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/register" element={<FaceRegistration />} />
        <Route
          path="/dashboard"
          element={
            consentProcessing && faceRegistered
              ? <Dashboard />
              : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}