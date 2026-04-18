import { Routes, Route, Navigate } from 'react-router-dom'
import useUserStore from './store/userStore'
import Onboarding from './pages/Onboarding'
import Consent from './pages/Consent'
import FaceRegistration from './pages/FaceRegistration'
import Dashboard from './pages/Dashboard'
import Capture from './pages/Capture'
import Result from './pages/Result'
import Alert from './pages/Alert'
import DeferredConfirm from './pages/DeferredConfirm'

export default function App() {
  const { consentProcessing, faceRegistered } = useUserStore()
  const onboardingDone = consentProcessing && faceRegistered

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/register" element={<FaceRegistration />} />
        <Route
          path="/dashboard"
          element={onboardingDone ? <Dashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/capture"
          element={onboardingDone ? <Capture /> : <Navigate to="/" replace />}
        />
        <Route
          path="/result"
          element={onboardingDone ? <Result /> : <Navigate to="/" replace />}
        />
        <Route
          path="/alert"
          element={onboardingDone ? <Alert /> : <Navigate to="/" replace />}
        />
        <Route
          path="/confirm"
          element={onboardingDone ? <DeferredConfirm /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}