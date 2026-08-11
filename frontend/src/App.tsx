import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { getRole } from './lib/store'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientDetail from './pages/PatientDetail'
import NurseCapture from './pages/NurseCapture'
import Alerts from './pages/Alerts'
import FamilyDoctor from './pages/FamilyDoctor'
import type { ReactNode } from 'react'

function Protected({ children }: { children: ReactNode }) {
  return getRole() ? <AppLayout>{children}</AppLayout> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/patients/:id" element={<Protected><PatientDetail /></Protected>} />
      <Route path="/capture" element={<Protected><NurseCapture /></Protected>} />
      <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
      <Route path="/followup" element={<Protected><FamilyDoctor /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
