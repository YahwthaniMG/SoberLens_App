// frontend/src/store/userStore.js
import { create } from 'zustand'

const KEYS = {
  deviceId:    'soberlens_device_id',
  role:        'soberlens_role',
  employeeId:  'soberlens_employee_id',
  workerId:    'soberlens_worker_id',
  companyId:   'soberlens_company_id',
  companyName: 'soberlens_company_name',
  workerName:  'soberlens_worker_name',
  area:        'soberlens_area',
  shift:       'soberlens_shift',
  faceRegistered: 'soberlens_face_registered',
  consentGiven:   'soberlens_consent_given',
  adminToken:  'soberlens_admin_token',
  adminCompanyId:   'soberlens_admin_company_id',
  adminCompanyName: 'soberlens_admin_company_name',
  adminAccessCode: 'soberlens_admin_access_code',
  accessPointCompanyId:   'soberlens_ap_company_id',
accessPointCompanyName: 'soberlens_ap_company_name',
accessPointAccessCode:  'soberlens_ap_access_code',
accessPointEmployeeId:  'soberlens_ap_employee_id',
accessPointWorkerName:  'soberlens_ap_worker_name',
}

function get(key) {
  return localStorage.getItem(key) || ''
}

function getBool(key) {
  return localStorage.getItem(key) === 'true'
}

function set(key, value) {
  localStorage.setItem(key, value)
}

function getOrCreateDeviceId() {
  let id = localStorage.getItem(KEYS.deviceId)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEYS.deviceId, id)
  }
  return id
}

const useUserStore = create((setState) => ({
  // Compartido
  deviceId: getOrCreateDeviceId(),
  role: get(KEYS.role), // 'employee' | 'admin' | ''

  // Empleado
  employeeId:  get(KEYS.employeeId),
  workerId:    get(KEYS.workerId),
  companyId:   get(KEYS.companyId),
  companyName: get(KEYS.companyName),
  workerName:  get(KEYS.workerName),
  area:        get(KEYS.area),
  shift:       get(KEYS.shift),
  faceRegistered: getBool(KEYS.faceRegistered),
  consentGiven:   getBool(KEYS.consentGiven),

  // Admin
  adminToken:       get(KEYS.adminToken),
  adminCompanyId:   get(KEYS.adminCompanyId),
  adminCompanyName: get(KEYS.adminCompanyName),
  adminAccessCode: get(KEYS.adminAccessCode),
  
  accessPointCompanyId:   get('soberlens_ap_company_id'),
  accessPointCompanyName: get('soberlens_ap_company_name'),
  accessPointAccessCode:  get('soberlens_ap_access_code'),
  accessPointEmployeeId:  get('soberlens_ap_employee_id'),
  accessPointWorkerName:  get('soberlens_ap_worker_name'),

  // ---------------------------------------------------------------------------
  // Acciones compartidas
  // ---------------------------------------------------------------------------

  setRole(role) {
    set(KEYS.role, role)
    setState({ role })
  },

  // ---------------------------------------------------------------------------
  // Acciones empleado
  // ---------------------------------------------------------------------------

  setCompany(companyId, companyName) {
    set(KEYS.companyId, companyId)
    set(KEYS.companyName, companyName)
    setState({ companyId: String(companyId), companyName })
  },

  setEmployeeProfile(employeeId, workerId, workerName, area, shift) {
    set(KEYS.employeeId, employeeId)
    set(KEYS.workerId, workerId)
    set(KEYS.workerName, workerName)
    set(KEYS.area, area)
    set(KEYS.shift, shift)
    setState({
      employeeId: String(employeeId),
      workerId,
      workerName,
      area,
      shift,
    })
  },

  setFaceRegistered(value) {
    set(KEYS.faceRegistered, value)
    setState({ faceRegistered: value })
  },

  setConsentGiven(value) {
    set(KEYS.consentGiven, value)
    setState({ consentGiven: value })
  },

  // ---------------------------------------------------------------------------
  // Acciones admin
  // ---------------------------------------------------------------------------

  setAdminSession(token, companyId, companyName, accessCode) {
    set(KEYS.adminToken, token)
    set(KEYS.adminCompanyId, companyId)
    set(KEYS.adminCompanyName, companyName)
    set(KEYS.adminAccessCode, accessCode)
    setState({
      adminToken: token,
      adminCompanyId: String(companyId),
      adminCompanyName: companyName,
      adminAccessCode: accessCode,
      role: 'admin',
    })
    set(KEYS.role, 'admin')
  },

  setAccessPointCompany(companyId, companyName, accessCode) {
    localStorage.setItem('soberlens_ap_company_id',   String(companyId))
    localStorage.setItem('soberlens_ap_company_name', companyName)
    localStorage.setItem('soberlens_ap_access_code',  accessCode)
    setState({
      accessPointCompanyId:   String(companyId),
      accessPointCompanyName: companyName,
      accessPointAccessCode:  accessCode,
    })
  },

  setAccessPointEmployee(employeeId, workerName) {
    localStorage.setItem('soberlens_ap_employee_id',  String(employeeId))
    localStorage.setItem('soberlens_ap_worker_name',  workerName)
    setState({ accessPointEmployeeId: String(employeeId), accessPointWorkerName: workerName })
  },

  clearAccessPointEmployee() {
    localStorage.removeItem('soberlens_ap_employee_id')
    localStorage.removeItem('soberlens_ap_worker_name')
    setState({ accessPointEmployeeId: '', accessPointWorkerName: '' })
  },

  // ---------------------------------------------------------------------------
  // Cerrar sesion (limpia todo)
  // ---------------------------------------------------------------------------

  // Cerrar sesion como empleado (solo borra datos de empleado)
  logoutEmployee() {
    const keysToRemove = [
      KEYS.role, KEYS.employeeId, KEYS.workerId, KEYS.companyId,
      KEYS.companyName, KEYS.workerName, KEYS.area, KEYS.shift,
      KEYS.faceRegistered, KEYS.consentGiven,
    ]
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setState({
      role: '',
      employeeId: '', workerId: '', companyId: '', companyName: '',
      workerName: '', area: '', shift: '',
      faceRegistered: false, consentGiven: false,
    })
  },

  // Cerrar sesion como admin (solo borra datos de admin)
  logoutAdmin() {
    const keysToRemove = [
      KEYS.role, KEYS.adminToken, KEYS.adminCompanyId,
      KEYS.adminCompanyName, KEYS.adminAccessCode,
    ]
    keysToRemove.forEach(k => localStorage.removeItem(k))
    setState({
      role: '',
      adminToken: '', adminCompanyId: '', adminCompanyName: '', adminAccessCode: '',
    })
  },

  // Logout completo (borra todo menos deviceId)
  logout() {
    const currentDeviceId = localStorage.getItem(KEYS.deviceId)
    Object.values(KEYS).forEach(k => {
      if (k !== KEYS.deviceId) localStorage.removeItem(k)
    })
    setState({
      role: '',
      employeeId: '', workerId: '', companyId: '', companyName: '',
      workerName: '', area: '', shift: '',
      faceRegistered: false, consentGiven: false,
      adminToken: '', adminCompanyId: '', adminCompanyName: '', adminAccessCode: '',
    })
  },
}))

export default useUserStore