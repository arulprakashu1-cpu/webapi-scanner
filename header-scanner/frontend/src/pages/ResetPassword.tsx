import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, Clock } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'
import { authApi } from '../api/auth'
import { useGlobalToast } from '../App'

function MiniLogo() {
  return (
    <Link to="/"><img src="/logo-white.svg" alt="GozoBee" style={{ height: '24px' }}/></Link>
  )
}

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const toast = useGlobalToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setError('Passwords do not match')
    if (newPassword.length < 15) return setError('Password must be at least 15 characters')
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword })
      toast.addToast('Password changed successfully! Sign in to continue.', 'success')
      navigate('/login')
    } catch (err: any) {
      const detail = err.response?.data?.detail || ''
      if (detail.includes('expired') || detail.includes('invalid')) {
        setExpired(true)
      } else {
        setError(detail || 'Failed to reset password. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const Nav = () => (
    <nav className="border-b border-border-warm bg-surface px-4 h-14 flex items-center">
      <MiniLogo />
    </nav>
  )

  if (expired) return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full">
          <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-head mb-2">Reset link expired</h1>
          <p className="text-muted text-sm mb-6">This link has expired or already been used.</p>
          <Link to="/forgot-password" className="btn-primary inline-block">Request a new link</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-head mb-2 tracking-tight">Set new password</h1>
            <p className="text-muted text-sm">Choose a strong passphrase of at least 15 characters.</p>
          </div>
          <form onSubmit={handleSubmit} className="card space-y-4">
            <PasswordInput label="New Password" required value={newPassword} onChange={setNewPassword} placeholder="Minimum 15 characters" hint="Use a passphrase for best security" />
            <PasswordInput label="Confirm New Password" required value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat your new password" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
