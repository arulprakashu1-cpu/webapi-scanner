import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import { createContext, useContext } from 'react'

// Pages
import { Landing } from './pages/Landing'
import { Register } from './pages/Register'
import { VerifyEmailSent } from './pages/VerifyEmailSent'
import { VerificationSuccess } from './pages/VerificationSuccess'
import { VerificationExpired } from './pages/VerificationExpired'
import { Login } from './pages/Login'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { ChangeExpiredPassword } from './pages/ChangeExpiredPassword'
import { Dashboard } from './pages/Dashboard'
import { NewProfile } from './pages/NewProfile'
import { ProfileDetail } from './pages/ProfileDetail'
import { ScanDetail } from './pages/ScanDetail'
import { VulnerabilityDetail } from './pages/VulnerabilityDetail'
import { UserProfile } from './pages/UserProfile'
import { ProtectedRoute } from './components/ProtectedRoute'

// Toast context for global access
export const ToastCtx = createContext<ReturnType<typeof useToast> | null>(null)
export const useGlobalToast = () => useContext(ToastCtx)!

function AppInner() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
      <Route path="/verify-email" element={<VerificationSuccess />} />
      <Route path="/verification-success" element={<VerificationSuccess />} />
      <Route path="/verification-expired" element={<VerificationExpired />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-expired-password" element={<ChangeExpiredPassword />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/new" element={<ProtectedRoute><NewProfile /></ProtectedRoute>} />
      <Route path="/dashboard/:profileId" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
      <Route path="/dashboard/:profileId/scan/:runId" element={<ProtectedRoute><ScanDetail /></ProtectedRoute>} />
      <Route path="/dashboard/:profileId/scan/:runId/finding/:findingId" element={<ProtectedRoute><VulnerabilityDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const toast = useToast()
  return (
    <BrowserRouter>
      <ToastCtx.Provider value={toast}>
        <AppInner />
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      </ToastCtx.Provider>
    </BrowserRouter>
  )
}
