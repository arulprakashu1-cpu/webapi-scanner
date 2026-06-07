import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

function MiniLogo() {
  return (
    <Link to="/"><img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/></Link>
  )
}

export function VerificationSuccess() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      window.location.replace(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
    }
  }, [token])

  if (token) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <p className="text-muted text-sm">Verifying your email…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <nav className="border-b border-border-warm bg-surface px-4 h-14 flex items-center">
        <MiniLogo />
      </nav>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-black text-head mb-2 tracking-tight">Email Verified!</h1>
          <p className="text-muted text-sm mb-6">Your account is now active. Sign in to start scanning security headers.</p>
          <Link to="/login" className="btn-primary inline-block">Sign In to Your Account</Link>
        </div>
      </div>
    </div>
  )
}
