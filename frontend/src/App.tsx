import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { SidebarProvider } from './contexts/SidebarContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NewScanPage from './pages/NewScanPage'
import ScanDetailPage from './pages/ScanDetailPage'
import TargetsPage from './pages/TargetsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/scans" element={<ProtectedRoute><Navigate to="/scans/new" replace /></ProtectedRoute>} />
      <Route path="/scans/new" element={<ProtectedRoute><NewScanPage /></ProtectedRoute>} />
      <Route path="/scans/:id" element={<ProtectedRoute><ScanDetailPage /></ProtectedRoute>} />
      <Route path="/targets" element={<ProtectedRoute><TargetsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      {/* Admin routes — completely separate, no app Layout */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/ci" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ThemeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', stored)
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemeInitializer />
        <SidebarProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
