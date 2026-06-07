import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
