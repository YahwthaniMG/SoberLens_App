// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import useUserStore from './store/userStore'

// Pantallas compartidas
import RoleSelection      from './pages/RoleSelection'
import Privacy            from './pages/Privacy'

// Flujo empleado
import EmployeeJoin         from './pages/EmployeeJoin'
import EmployeeIdVerify     from './pages/EmployeeIdVerify'
import EmployeeFaceRegister from './pages/EmployeeFaceRegister'
import Consent              from './pages/Consent'
import EmployeeDashboard    from './pages/EmployeeDashboard'
import Capture              from './pages/Capture'
import Result               from './pages/Result'
import Schedule             from './pages/Schedule'
import UserProfile from './pages/UserProfile'
import AdminEmployeeList from './pages/AdminEmployeeList'
import EmployeeDeviceRecovery from './pages/EmployeeDeviceRecovery'

// Flujo admin
import CompanyRegister     from './pages/CompanyRegister'
import AdminLogin          from './pages/AdminLogin'
import AdminDashboard      from './pages/AdminDashboard'
import AdminEmployeeDetail from './pages/AdminEmployeeDetail'
import SecondVerification  from './pages/SecondVerification'
import AdminSettings from './pages/AdminSettings'

// Punto Acceso
import AccessPointSetup   from './pages/AccessPointSetup'
import AccessPointWorker  from './pages/AccessPointWorker'
import AccessPointCapture from './pages/AccessPointCapture'
import AccessPointResult from './pages/AccessPointResult'


function EmployeeGuard({ children }) {
  const { role, faceRegistered, consentGiven, employeeId } = useUserStore()
  if (role !== 'employee') return <Navigate to="/" replace />
  if (!employeeId || !faceRegistered || !consentGiven) return <Navigate to="/join" replace />
  return children
}

function AdminGuard({ children }) {
  const { role, adminToken } = useUserStore()
  if (role !== 'admin' || !adminToken) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { role, employeeId, faceRegistered, consentGiven, adminToken } = useUserStore()

  function getDefaultRoute() {
    if (role === 'admin' && adminToken) return '/admin/dashboard'
    if (role === 'employee') {
      if (!employeeId)     return '/join'
      if (!consentGiven)   return '/consent'
      if (!faceRegistered) return '/register-face'
      return '/dashboard'
    }
    return '/'
  }

  return (
    <Routes>
      {/* Entrada */}
      <Route path="/" element={<RoleSelection />} />

      {/* Flujo empleado — registro */}
      <Route path="/join"          element={<EmployeeJoin />} />
      <Route path="/verify-id"     element={<EmployeeIdVerify />} />
      <Route path="/register-face" element={<EmployeeFaceRegister />} />
      <Route path="/consent"       element={<Consent />} />

      {/* Flujo empleado — app */}
      <Route path="/dashboard" element={
        <EmployeeGuard><EmployeeDashboard /></EmployeeGuard>
      } />
      <Route path="/capture" element={
        <EmployeeGuard><Capture /></EmployeeGuard>
      } />
      <Route path="/result" element={
        <EmployeeGuard><Result /></EmployeeGuard>
      } />
      <Route path="/schedule" element={
        <EmployeeGuard><Schedule /></EmployeeGuard>
      } />
      <Route path="/profile" element={
        <EmployeeGuard><UserProfile /></EmployeeGuard>
      } />

      {/* Flujo admin — registro y login */}
      <Route path="/admin/register" element={<CompanyRegister />} />
      <Route path="/admin/login"    element={<AdminLogin />} />

      {/* Flujo admin — app */}
      <Route path="/admin/dashboard" element={
        <AdminGuard><AdminDashboard /></AdminGuard>
      } />
      <Route path="/admin/employees/:id" element={
        <AdminGuard><AdminEmployeeDetail /></AdminGuard>
      } />
      <Route path="/admin/sessions/:id/verify" element={
        <AdminGuard><SecondVerification /></AdminGuard>
      } />
      <Route path="/admin/settings" element={
        <AdminGuard><AdminSettings /></AdminGuard>
      } />
      <Route path="/admin/employees" element={
        <AdminGuard><AdminEmployeeList /></AdminGuard>
      } />

      <Route path="/access-point/setup"   element={<AccessPointSetup />} />
      <Route path="/access-point/worker"  element={<AccessPointWorker />} />
      <Route path="/access-point/capture" element={<AccessPointCapture />} />
      <Route path="/access-point/result"  element={<AccessPointResult />} />
      <Route path="/recover-device" element={<EmployeeDeviceRecovery />} />
      
      {/* Compartidas */}
      <Route path="/privacy" element={<Privacy />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  )
}